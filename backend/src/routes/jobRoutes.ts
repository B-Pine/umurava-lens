import { Router } from 'express';
import { createJob, getJobs, getJobById, updateJob, deleteJob, getDashboardStats } from '../controllers/jobController';

const router = Router();

router.get('/dashboard/stats', getDashboardStats);
router.post('/', createJob);
router.get('/', getJobs);
router.get('/:id', getJobById);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;
