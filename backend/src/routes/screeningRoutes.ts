import { Router } from 'express';
import {
  runScreening,
  getScreeningResults,
  getComparisonData,
  getShortlisted,
  updateEmailDraft,
  setInterviewDecision,
} from '../controllers/screeningController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/run', protect, runScreening);
router.get('/shortlisted', protect, getShortlisted);
router.get('/compare', protect, getComparisonData);
router.patch('/results/:id/email', protect, updateEmailDraft);
router.patch('/results/:id/interview-decision', protect, setInterviewDecision);
router.get('/:jobId', protect, getScreeningResults);

export default router;
