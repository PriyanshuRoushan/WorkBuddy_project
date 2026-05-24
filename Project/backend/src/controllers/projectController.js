import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import TeamMember from '../models/TeamMember.js';
import User from '../models/User.js';
import ChatRoom from '../models/ChatRoom.js';
import ProjectMember from '../models/ProjectMember.js';

export const getProjects = async (req, res) => {
  try {
    let projects;
    if (req.user && (req.user.role === 'Project Manager' || req.user.role === 'Admin')) {
      projects = await Project.find().sort({ updatedAt: -1 });
    } else {
      const memberships = await ProjectMember.find({ userId: req.user._id });
      const projectIds = memberships.map(m => m.projectId);
      projects = await Project.find({ _id: { $in: projectIds } }).sort({ updatedAt: -1 });
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  const { title, description, progress, status, collaborators } = req.body;
  try {
    const project = new Project({ title, description, progress, status, collaborators, creator: req.user._id });
    const savedProject = await project.save();
    
    // Auto-create Chat Room
    await ChatRoom.create({
      projectId: savedProject._id,
      name: `${title} Collaboration Chat`
    });

    // Populate ProjectMember collection
    // 1. Add PM
    await ProjectMember.create({
      projectId: savedProject._id,
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role
    });

    // 2. Add collaborators
    if (collaborators && collaborators.length > 0) {
      for (const colImg of collaborators) {
        const teamMember = await TeamMember.findOne({ profileImage: colImg });
        if (teamMember) {
          const user = await User.findOne({ email: teamMember.email });
          if (user) {
            await ProjectMember.create({
              projectId: savedProject._id,
              userId: user._id,
              email: user.email,
              role: user.role
            }).catch(err => console.log('Duplicate ProjectMember check skipped:', err.message));
          }
        }
      }
    }

    // Log activity
    await Activity.create({
      user: req.user.name.split(' ')[0],
      action: 'started a new project',
      target: title,
      type: 'add'
    });

    res.status(201).json(savedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const originalProject = await Project.findById(req.params.id);
    if (!originalProject) return res.status(404).json({ message: 'Project not found' });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Sync collaborators to ProjectMember if collaborators is updated
    if (req.body.collaborators) {
      // Keep project creator as member
      let creatorUser = originalProject.creator ? await User.findById(originalProject.creator) : null;
      const creatorMember = await ProjectMember.findOne({ projectId: req.params.id, role: 'Project Manager' });
      await ProjectMember.deleteMany({ projectId: req.params.id });

      if (creatorUser) {
        await ProjectMember.create({
          projectId: req.params.id,
          userId: creatorUser._id,
          email: creatorUser.email,
          role: creatorUser.role
        });
      } else if (creatorMember) {
        await ProjectMember.create({
          projectId: req.params.id,
          userId: creatorMember.userId,
          email: creatorMember.email,
          role: creatorMember.role
        });
      } else {
        await ProjectMember.create({
          projectId: req.params.id,
          userId: req.user._id,
          email: req.user.email,
          role: req.user.role
        });
      }

      for (const colImg of req.body.collaborators) {
        const teamMember = await TeamMember.findOne({ profileImage: colImg });
        if (teamMember) {
          const user = await User.findOne({ email: teamMember.email });
          if (user) {
            await ProjectMember.create({
              projectId: req.params.id,
              userId: user._id,
              email: user.email,
              role: user.role
            }).catch(err => console.log('Duplicate ProjectMember check skipped:', err.message));
          }
        }
      }
    }

    // Log activity if progress or status changed significantly
    let action = '';
    if (originalProject.status !== updatedProject.status) {
      action = `moved status to ${updatedProject.status} for`;
    } else if (originalProject.progress !== updatedProject.progress) {
      action = `updated progress to ${updatedProject.progress}% for`;
    }

    if (action) {
      await Activity.create({
        user: req.user.name.split(' ')[0],
        action,
        target: updatedProject.title,
        type: updatedProject.status === 'DONE' ? 'check' : 'add'
      });
    }

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Assert that the user is the project creator
    if (project.creator && project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: Only the project creator can delete this workspace.' });
    }

    await Project.findByIdAndDelete(req.params.id);

    // Clean up ChatRoom & ProjectMembers
    await ChatRoom.findOneAndDelete({ projectId: req.params.id });
    await ProjectMember.deleteMany({ projectId: req.params.id });

    // Log activity
    await Activity.create({
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
