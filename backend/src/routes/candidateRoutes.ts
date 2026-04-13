import { Router } from 'express';
import { uploadCandidates, getCandidates, getCandidateById } from '../controllers/candidateController';

const router = Router();

router.post('/upload', uploadCandidates);
router.get('/', getCandidates);
router.get('/:id', getCandidateById);

export default router;
