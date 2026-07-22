import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import ChatRoom from '../models/ChatRoom.js';
import ProjectMember from '../models/ProjectMember.js';
import { tenantFilter } from '../utils/tenant.js';

const resolveUsers = async (organizationId, collaboratorValues = []) => {
  if (!collaboratorValues.length) return [];

  return User.find({
    organizationId,
    $or: [
      { _id: { $in: collaboratorValues.filter(value => /^[a-f\d]{24}$/i.test(String(value))) } },
      { profileImage: { $in: collaboratorValues } },
      { email: { $in: collaboratorValues.map(value => String(value).toLowerCase()) } }
    ]
  }).select('_id name email role profileImage');
};

const decorateProject = async (project) => {
  if (!project) return null;
  const plainProject = project.toObject ? project.toObject() : project;
  const memberships = await ProjectMember.find({
    organizationId: plainProject.organizationId,
    projectId: plainProject._id
  }).populate('userId', 'name email role profileImage');

  const collaboratorUsers = memberships
    .map(membership => membership.userId)
    .filter(Boolean);

  return {
    ...plainProject,
    creator: plainProject.creatorId || plainProject.creator,
    collaboratorUsers,
    // Temporary compatibility field for the existing avatar-based frontend.
    collaborators: collaboratorUsers.map(user => user.profileImage).filter(Boolean)
  };
};

const assertProjectAccess = async (req, projectId) => {
  if (req.user.role === 'Project Manager' || req.user.role === 'Admin') return true;
  return Boolean(await ProjectMember.exists({
    organizationId: req.user.organizationId,
    projectId,
    userId: req.user._id
  }));
};

export const getProjects = async (req, res) => {
  try {
    let query = tenantFilter(req);
    if (req.user.role !== 'Project Manager' && req.user.role !== 'Admin') {
      const memberships = await ProjectMember.find({
        organizationId: req.user.organizationId,
        userId: req.user._id
      });
      query = tenantFilter(req, { _id: { $in: memberships.map(membership => membership.projectId) } });
    }

    const projects = await Project.find(query).sort({ updatedAt: -1 });
    res.json(await Promise.all(projects.map(decorateProject)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!(await assertProjectAccess(req, project._id))) {
      return res.status(403).json({ message: 'Access denied: You are not a project member' });
    }
    res.json(await decorateProject(project));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  const { title, description, progress, status, collaborators = [] } = req.body;
  try {
    const project = await Project.create({
      organizationId: req.user.organizationId,
      title,
      description,
      progress,
      status,
      creator: req.user._id,
      creatorId: req.user._id
    });

    await ChatRoom.create({
      organizationId: req.user.organizationId,
      projectId: project._id,
      name: `${title} Collaboration Chat`,
      participants: [req.user._id]
    });

    const collaboratorUsers = await resolveUsers(req.user.organizationId, collaborators);
    const members = [
      { userId: req.user._id, email: req.user.email, role: 'Admin' },
      ...collaboratorUsers
        .filter(user => user._id.toString() !== req.user._id.toString())
        .map(user => ({ userId: user._id, email: user.email, role: 'Editor' }))
    ];

    await ProjectMember.insertMany(members.map(member => ({
      organizationId: req.user.organizationId,
      projectId: project._id,
      ...member
    })));

    await Activity.create({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      user: req.user.name.split(' ')[0],
      action: 'started a new project',
      target: title,
      type: 'add'
    });

    res.status(201).json(await decorateProject(project));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const oldStatus = project.status;
    const oldProgress = project.progress;
    const { collaborators, organizationId, creator, creatorId, ...updates } = req.body;
    Object.assign(project, updates);
    const updatedProject = await project.save();

    if (Array.isArray(collaborators)) {
      const collaboratorUsers = await resolveUsers(req.user.organizationId, collaborators);
      await ProjectMember.deleteMany({
        organizationId: req.user.organizationId,
        projectId: project._id,
        userId: { $ne: project.creatorId || project.creator }
      });

      for (const user of collaboratorUsers) {
        if (user._id.toString() === String(project.creatorId || project.creator)) continue;
        await ProjectMember.updateOne(
          {
            organizationId: req.user.organizationId,
            projectId: project._id,
            userId: user._id
          },
          {
            $set: { email: user.email, role: 'Editor' },
            $setOnInsert: { organizationId: req.user.organizationId, projectId: project._id, userId: user._id }
          },
          { upsert: true }
        );
      }
    }

    let action = '';
    if (oldStatus !== updatedProject.status) {
      action = `moved status to ${updatedProject.status} for`;
    } else if (oldProgress !== updatedProject.progress) {
      action = `updated progress to ${updatedProject.progress}% for`;
    }

    if (action) {
      await Activity.create({
        organizationId: req.user.organizationId,
        actorId: req.user._id,
        user: req.user.name.split(' ')[0],
        action,
        target: updatedProject.title,
        type: updatedProject.status === 'DONE' ? 'check' : 'add'
      });
    }

    res.json(await decorateProject(updatedProject));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const creatorId = project.creatorId || project.creator;
    if (creatorId && creatorId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Only the project creator can delete this workspace.' });
    }

    await Project.deleteOne({ _id: project._id });
    await ChatRoom.findOneAndDelete(tenantFilter(req, { projectId: project._id }));
    await ProjectMember.deleteMany(tenantFilter(req, { projectId: project._id }));

    await Activity.create({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      user: req.user.name.split(' ')[0],
      action: 'deleted the project',
      target: project.title,
      type: 'system'
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
