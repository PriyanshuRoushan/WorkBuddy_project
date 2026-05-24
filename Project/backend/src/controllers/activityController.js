import Activity from '../models/Activity.js';

export const getActivities = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role !== 'Project Manager' && req.user.role !== 'Admin') {
      const firstName = req.user.name.split(' ')[0];
      query = {
        $or: [
          { user: firstName },
          { user: 'System' }
        ]
      };
    }
    const activities = await Activity.find(query).sort({ createdAt: -1 }).limit(15);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createActivity = async (req, res) => {
  const { user, action, target, details, type } = req.body;
  try {
    const activity = new Activity({ user, action, target, details, type });
    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
