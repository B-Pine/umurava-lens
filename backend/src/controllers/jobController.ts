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
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
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
    // 14-day window for the application trend
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [
      activeJobs,
      totalCandidates,
      totalScreened,
      totalShortlisted,
      recentJobs,
      scoreAgg,
      topResults,
      recSplit,
      trendAgg,
    ] = await Promise.all([
      Job.countDocuments({ status: 'active' }),
      Candidate.countDocuments({}),
      Job.aggregate([{ $group: { _id: null, total: { $sum: '$screenedCount' } } }]),
      Job.aggregate([{ $group: { _id: null, total: { $sum: '$shortlistedCount' } } }]),
      Job.find({ status: 'active' }).sort({ updatedAt: -1 }).limit(3),
      ScreeningResult.aggregate([
        { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
      ]),
      ScreeningResult.find({ shortlisted: true })
        .sort({ score: -1 })
        .limit(15)
        .populate('candidateId', 'firstName lastName headline')
        .populate('jobId', 'title'),
      ScreeningResult.aggregate([
        { $group: { _id: '$recommendation', count: { $sum: 1 } } },
      ]),
      Candidate.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const screened = totalScreened.length > 0 ? totalScreened[0].total : 0;
    const shortlisted = totalShortlisted.length > 0 ? totalShortlisted[0].total : 0;
    const averageMatchScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avg * 10) / 10 : null;
    const averageMatchCount = scoreAgg.length > 0 ? scoreAgg[0].count : 0;

    const topTalents = topResults
      .filter((r: any) => r.candidateId)
      .map((r: any) => {
        const c = r.candidateId;
        const name = [c?.firstName, c?.lastName].filter(Boolean).join(' ').trim() || 'Unknown';
        return {
          _id: r._id,
          candidateId: c?._id,
          jobId: r.jobId?._id,
          name,
          role: c?.headline || r.jobId?.title || '',
          score: r.score,
          recommendation: r.recommendation,
        };
      });

    const recommendationSplit = { hire: 0, consider: 0, risky: 0 } as Record<string, number>;
    for (const entry of recSplit as Array<{ _id: string; count: number }>) {
      if (entry._id && recommendationSplit[entry._id] !== undefined) {
        recommendationSplit[entry._id] = entry.count;
      }
    }

    // Build continuous 14-day series even for days with zero candidates.
    const trendMap = new Map<string, number>();
    for (const row of trendAgg as Array<{ _id: string; count: number }>) {
      trendMap.set(row._id, row.count);
    }
    const applicationTrend: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      applicationTrend.push({ date: key, count: trendMap.get(key) || 0 });
    }

    res.json({
      activeJobCount: activeJobs,
      candidatesScreened: screened,
      averageMatchScore,
      averageMatchCount,
      recentJobs,
      topTalents,
      applicationTrend,
      recommendationSplit,
      pipeline: {
        applied: totalCandidates,
        screened,
        shortlisted,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
