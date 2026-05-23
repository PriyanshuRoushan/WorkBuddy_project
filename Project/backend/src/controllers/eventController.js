import Event from '../models/Event.js';
import Activity from '../models/Activity.js';

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEvent = async (req, res) => {
  const { title, description, date, color, collaborators } = req.body;
  try {
    const event = new Event({ title, description, date, color, collaborators });
    const savedEvent = await event.save();

    // Log activity
    await Activity.create({
      user: 'Creator',
      action: 'added a calendar event',
      target: title,
      type: 'add'
    });

    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Log activity
    await Activity.create({
      user: 'Creator',
      action: 'removed event',
      target: event.title,
      type: 'system'
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
