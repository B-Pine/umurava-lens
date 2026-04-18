import { Request, Response } from 'express';
import Job from '../models/Job';
import Candidate from '../models/Candidate';
import ScreeningResult from '../models/ScreeningResult';

export const createJob = async (req: Request, res: Response) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json(job);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getJobs = async (req: Request, res: Response) => {
  try {
    const { status, experienceLevel, sort, page = '1', limit = '10' } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (experienceLevel) filter.experienceLevel = experienceLevel;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let sortOption: any = { createdAt: -1 };
    if (sort === 'applicants') sortOption = { applicantCount: -1 };

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort(sortOption).skip((pageNum - 1) * limitNum).limit(limitNum),
      Job.countDocuments(filter),
    ]);

    res.json({
      jobs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    await ScreeningResult.deleteMany({ jobId: id });
    await Candidate.updateMany({ jobId: id }, { $set: { jobId: null } });

    res.json({ message: 'Job deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [activeJobs, totalScreened, recentJobs, scoreAgg, topResults] = await Promise.all([
      Job.countDocuments({ status: 'active' }),
      Job.aggregate([{ $group: { _id: null, total: { $sum: '$screenedCount' } } }]),
      Job.find({ status: 'active' }).sort({ updatedAt: -1 }).limit(3),
      ScreeningResult.aggregate([
        { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
      ]),
      ScreeningResult.find()
        .sort({ score: -1 })
        .limit(5)
        .populate('candidateId', 'fullName currentTitle')
        .populate('jobId', 'title'),
    ]);

    const screened = totalScreened.length > 0 ? totalScreened[0].total : 0;
    const averageMatchScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avg * 10) / 10 : null;
    const averageMatchCount = scoreAgg.length > 0 ? scoreAgg[0].count : 0;

    const topTalents = topResults
      .filter((r: any) => r.candidateId)
      .map((r: any) => ({
        _id: r._id,
        candidateId: r.candidateId?._id,
        jobId: r.jobId?._id,
        name: r.candidateId?.fullName || 'Unknown',
        role: r.candidateId?.currentTitle || r.jobId?.title || '',
        score: r.score,
        recommendation: r.recommendation,
      }));

    res.json({
      activeJobCount: activeJobs,
      candidatesScreened: screened,
      averageMatchScore,
      averageMatchCount,
      recentJobs,
      topTalents,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
