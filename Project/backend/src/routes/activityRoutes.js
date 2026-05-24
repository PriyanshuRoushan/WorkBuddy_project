import express from 'express';
import {
  getActivities,
  createActivity
} from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getActivities)
  .post(protect, createActivity);

export default router;
