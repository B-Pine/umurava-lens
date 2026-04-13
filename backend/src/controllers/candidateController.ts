import { Request, Response } from 'express';
import Candidate from '../models/Candidate';
import Job from '../models/Job';

export const uploadCandidates = async (req: Request, res: Response) => {
  try {
    const { candidates, jobId } = req.body;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'candidates array is required' });
    }

    const candidateDocs = candidates.map((c: any) => ({
      ...c,
      jobId: jobId || null,
    }));

    const created = await Candidate.insertMany(candidateDocs);

    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        $inc: { applicantCount: created.length },
      });
    }

    res.status(201).json({
      message: `${created.length} candidates uploaded successfully`,
      candidates: created,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const { jobId, page = '1', limit = '50' } = req.query;
    const filter: any = {};
    if (jobId) filter.jobId = jobId;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const [candidates, total] = await Promise.all([
      Candidate.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Candidate.countDocuments(filter),
    ]);

    res.json({
      candidates,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
