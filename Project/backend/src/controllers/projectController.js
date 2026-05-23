import Project from '../models/Project.js';
import Activity from '../models/Activity.js';

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ updatedAt: -1 });
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
    const project = new Project({ title, description, progress, status, collaborators });
    const savedProject = await project.save();
    
    // Log activity
    await Activity.create({
      user: 'Creator',
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

    // Log activity if progress or status changed significantly
    let action = '';
    if (originalProject.status !== updatedProject.status) {
      action = `moved status to ${updatedProject.status} for`;
    } else if (originalProject.progress !== updatedProject.progress) {
      action = `updated progress to ${updatedProject.progress}% for`;
    }

    if (action) {
      await Activity.create({
        user: 'Creator',
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
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Log activity
    await Activity.create({
      user: 'Creator',
      action: 'deleted the project',
      target: project.title,
      type: 'system'
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
