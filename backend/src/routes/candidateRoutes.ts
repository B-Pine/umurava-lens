import { Router } from 'express';
import multer from 'multer';
import { uploadCandidates, uploadCandidateFiles, getCandidates, getCandidateById, deleteCandidate, deleteCandidates } from '../controllers/candidateController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', uploadCandidates);
router.post('/upload/files', upload.array('files', 10), uploadCandidateFiles);
router.get('/', getCandidates);
router.delete('/', deleteCandidates);
router.get('/:id', getCandidateById);
router.delete('/:id', deleteCandidate);

export default router;
