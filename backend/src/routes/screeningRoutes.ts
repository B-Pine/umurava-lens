import { Router } from 'express';
import {
  runScreening,
  getScreeningResults,
  getComparisonData,
  getShortlisted,
  updateEmailDraft,
} from '../controllers/screeningController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/run', protect, runScreening);
router.get('/shortlisted', protect, getShortlisted);
router.get('/compare', protect, getComparisonData);
router.patch('/results/:id/email', protect, updateEmailDraft);
router.get('/:jobId', protect, getScreeningResults);

export default router;
