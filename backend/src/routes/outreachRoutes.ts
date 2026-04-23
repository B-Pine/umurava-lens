import { Router } from 'express';
import { sendOutreach, sendOutreachBatch } from '../controllers/outreachController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/send', protect, sendOutreach);
router.post('/send/batch', protect, sendOutreachBatch);

export default router;
