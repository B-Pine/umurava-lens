import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getDashboardStats,
} from '../controllers/jobController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/dashboard/stats', protect, getDashboardStats);
router.post('/', protect, createJob);
router.get('/', protect, getJobs);
router.get('/:id', protect, getJobById);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);

export default router;
