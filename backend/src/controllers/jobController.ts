import { Request, Response } from 'express';
import Job from '../models/Job';

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
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [activeJobs, totalScreened, recentJobs] = await Promise.all([
      Job.countDocuments({ status: 'active' }),
      Job.aggregate([{ $group: { _id: null, total: { $sum: '$screenedCount' } } }]),
      Job.find({ status: 'active' }).sort({ updatedAt: -1 }).limit(3),
    ]);

    const screened = totalScreened.length > 0 ? totalScreened[0].total : 0;

    res.json({
      activeJobCount: activeJobs,
      candidatesScreened: screened,
      averageMatchScore: 84.2,
      recentJobs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
