import Task from '../models/Task.js';
import Activity from '../models/Activity.js';

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ updatedAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  const { title, category, status, progress, dueDate } = req.body;
  try {
    const task = new Task({ title, category, status, progress, dueDate });
    const savedTask = await task.save();

    // Log activity
    await Activity.create({
      user: 'Creator',
      action: 'created a new task',
      target: title,
      type: 'add'
    });

    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const originalTask = await Task.findById(req.params.id);
    if (!originalTask) return res.status(404).json({ message: 'Task not found' });

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Log activity if completed or changed column
    let action = '';
    if (originalTask.status !== updatedTask.status) {
      if (updatedTask.status === 'DONE') {
        action = 'completed task';
      } else {
        action = `moved task to ${updatedTask.status}`;
      }
    }

    if (action) {
      await Activity.create({
        user: 'Creator',
        action,
        target: updatedTask.title,
        type: updatedTask.status === 'DONE' ? 'check' : 'add'
      });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Log activity
    await Activity.create({
      user: 'Creator',
      action: 'deleted task',
      target: task.title,
      type: 'system'
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
