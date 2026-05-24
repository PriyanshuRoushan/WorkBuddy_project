import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';
import { protect, requireProjectManager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getProjects)
  .post(protect, requireProjectManager, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(protect, requireProjectManager, updateProject)
  .delete(protect, requireProjectManager, deleteProject);

export default router;
