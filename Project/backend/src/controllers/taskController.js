import Task from '../models/Task.js';
import User from '../models/User.js';
import ProjectMember from '../models/ProjectMember.js';
import Activity from '../models/Activity.js';
import { tenantFilter } from '../utils/tenant.js';

const resolveAssignee = async (organizationId, value, fallbackUser) => {
  if (!value) return fallbackUser;
  if (/^[a-f\d]{24}$/i.test(String(value))) {
    return User.findOne({ _id: value, organizationId });
  }
  return User.findOne({ organizationId, email: String(value).toLowerCase() });
};

const serializeTask = (task) => {
  const plainTask = task.toObject ? task.toObject() : task;
  const assignee = plainTask.assignedTo;
  return {
    ...plainTask,
    assignedToUserId: assignee?._id || assignee,
    assignedTo: assignee?.email || plainTask.assignedToEmail || assignee
  };
};

const canAccessProject = async (req, projectId) => {
  if (!projectId || req.user.role === 'Project Manager' || req.user.role === 'Admin') return true;
  return Boolean(await ProjectMember.exists({
    organizationId: req.user.organizationId,
    projectId,
    userId: req.user._id
  }));
};

export const getTasks = async (req, res) => {
  const { projectId } = req.query;
  try {
    if (projectId && !(await canAccessProject(req, projectId))) {
      return res.status(403).json({ message: 'Access denied: You are not a project member' });
    }

    const query = projectId
      ? tenantFilter(req, { projectId })
      : tenantFilter(req, { assignedTo: req.user._id });
    const tasks = await Task.find(query).populate('assignedTo', 'name email role profileImage').sort({ updatedAt: -1 });
    res.json(tasks.map(serializeTask));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  const {
    title,
    category,
    status,
    progress,
    dueDate,
    assignedTo,
    projectId,
    requiredSkills,
    complexityScore
  } = req.body;

  try {
    if (projectId && !(await canAccessProject(req, projectId))) {
      return res.status(403).json({ message: 'Access denied: You are not a project member' });
    }

    const assignee = await resolveAssignee(req.user.organizationId, assignedTo, req.user);
    if (!assignee) return res.status(400).json({ message: 'Assignee not found in this organization' });

    const task = await Task.create({
      organizationId: req.user.organizationId,
      title,
      category,
      status,
      progress,
      dueDate,
      assignedTo: assignee._id,
      assignedToEmail: assignee.email,
      projectId,
      requiredSkills,
      complexityScore
    });

    await Activity.create({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      user: req.user.name.split(' ')[0],
      action: 'created a new task',
      target: title,
      type: 'add'
    });

    await task.populate('assignedTo', 'name email role profileImage');
    res.status(201).json(serializeTask(task));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await canAccessProject(req, task.projectId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = task.status;
    const updates = { ...req.body };
    if (updates.assignedTo) {
      const assignee = await resolveAssignee(req.user.organizationId, updates.assignedTo, req.user);
      if (!assignee) return res.status(400).json({ message: 'Assignee not found in this organization' });
      updates.assignedTo = assignee._id;
      updates.assignedToEmail = assignee.email;
    }
    if (updates.status === 'DONE' && oldStatus !== 'DONE') updates.completedAt = new Date();
    if (updates.status && updates.status !== 'DONE') updates.completedAt = null;

    Object.assign(task, updates);
    await task.save();

    if (oldStatus !== task.status) {
      await Activity.create({
        organizationId: req.user.organizationId,
        actorId: req.user._id,
        user: req.user.name.split(' ')[0],
        action: task.status === 'DONE' ? 'completed task' : `moved task to ${task.status}`,
        target: task.title,
        type: task.status === 'DONE' ? 'check' : 'add'
      });
    }

    await task.populate('assignedTo', 'name email role profileImage');
    res.json(serializeTask(task));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await canAccessProject(req, task.projectId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await task.deleteOne();
    await Activity.create({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      user: req.user.name.split(' ')[0],
      action: 'deleted task',
      target: task.title,
      type: 'system'
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
