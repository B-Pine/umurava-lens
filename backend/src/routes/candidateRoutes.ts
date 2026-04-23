import { Router } from 'express';
import multer from 'multer';
import {
  uploadCandidates,
  uploadCandidateFiles,
  uploadCandidatesCsv,
  getCandidates,
  getCandidateById,
  deleteCandidate,
  deleteCandidates,
} from '../controllers/candidateController';
import { protect } from '../middleware/auth';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file
});

router.post('/upload', protect, uploadCandidates);
router.post('/upload/files', protect, upload.array('files', 20), uploadCandidateFiles);
router.post('/upload/csv', protect, upload.array('files', 5), uploadCandidatesCsv);
router.get('/', protect, getCandidates);
router.delete('/', protect, deleteCandidates);
router.get('/:id', protect, getCandidateById);
router.delete('/:id', protect, deleteCandidate);

export default router;
