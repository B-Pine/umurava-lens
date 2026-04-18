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

const { PDFParse } = require('pdf-parse');
import { extractCandidateFromCV } from '../services/geminiService';

export const uploadCandidateFiles = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const parsedCandidates: any[] = [];
    const failed: { file: string; reason: string }[] = [];

    for (const file of files) {
      if (file.mimetype !== 'application/pdf') {
        failed.push({ file: file.originalname, reason: 'Not a PDF file' });
        continue;
      }
      try {
        const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
        const data = await parser.getText();
        const candidateProfile = await extractCandidateFromCV(data.text);
        candidateProfile.jobId = jobId || null;
        parsedCandidates.push(candidateProfile);
      } catch (err: any) {
        console.error(`Failed to parse ${file.originalname}:`, err?.message || err);
        failed.push({ file: file.originalname, reason: err?.message || 'Parse error' });
      }
    }

    if (parsedCandidates.length === 0) {
      return res.status(400).json({
        error: 'No valid PDFs were processed',
        failed,
      });
    }

    const created = await Candidate.insertMany(parsedCandidates);

    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        $inc: { applicantCount: created.length },
      });
    }

    res.status(201).json({
      message: `${created.length} of ${files.length} candidates parsed and uploaded successfully`,
      candidates: created,
      failed,
    });
  } catch (error: any) {
    console.error('File Upload Error:', error);
    res.status(500).json({ error: error.message || 'File parsing failed' });
  }
};

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const { jobId, page = '1', limit = '50', dateFrom, dateTo, search } = req.query;
    const filter: any = {};
    if (jobId) {
      filter.jobId = jobId === 'unassigned' ? null : jobId;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) {
        const end = new Date(dateTo as string);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (search) {
      const re = new RegExp((search as string).trim(), 'i');
      filter.$or = [
        { fullName: re },
        { email: re },
        { currentTitle: re },
        { currentCompany: re },
        { skills: re },
      ];
    }

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

export const deleteCandidate = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    if (candidate.jobId) {
      await Job.findByIdAndUpdate(candidate.jobId, { $inc: { applicantCount: -1 } });
    }
    res.json({ message: 'Candidate deleted', id: candidate._id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCandidates = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const targets = await Candidate.find({ _id: { $in: ids } }, { jobId: 1 });
    const counts: Record<string, number> = {};
    for (const t of targets) {
      if (t.jobId) {
        const k = String(t.jobId);
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    await Candidate.deleteMany({ _id: { $in: ids } });
    await Promise.all(
      Object.entries(counts).map(([jobId, n]) =>
        Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: -n } })
      )
    );
    res.json({ message: 'Candidates deleted', deleted: targets.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
