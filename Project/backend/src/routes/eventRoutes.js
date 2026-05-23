import express from 'express';
import { getEvents, createEvent, deleteEvent } from '../controllers/eventController.js';

const router = express.Router();

router.route('/')
  .get(getEvents)
  .post(createEvent);

router.route('/:id')
  .delete(deleteEvent);

export default router;
