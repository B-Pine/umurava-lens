import { Router } from 'express';
import { runScreening, getScreeningResults, getComparisonData } from '../controllers/screeningController';

const router = Router();

router.post('/run', runScreening);
router.get('/compare', getComparisonData);
router.get('/:jobId', getScreeningResults);

export default router;
