import { Request, Response } from 'express';
import Job from '../models/Job';
import Candidate from '../models/Candidate';
import ScreeningResult from '../models/ScreeningResult';
import { screenCandidates } from '../services/geminiService';

export const runScreening = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const candidates = await Candidate.find({ jobId });
    if (candidates.length === 0) {
      return res.status(400).json({ error: 'No candidates found for this job' });
    }

    // Call Gemini AI for screening
    const aiResults = await screenCandidates(job, candidates);

    // Delete existing results for this job (re-run support)
    await ScreeningResult.deleteMany({ jobId });

    // Save new results
    const screeningDocs = aiResults.candidates.map((result) => ({
      jobId,
      candidateId: result.candidateId,
      score: result.score,
      rank: result.rank,
      strengths: result.strengths,
      gaps: result.gaps,
      summary: result.summary,
      recommendation: result.recommendation,
      confidence: result.confidence,
      technicalSkillsScore: result.technicalSkillsScore,
      experienceScore: result.experienceScore,
      educationScore: result.educationScore,
      projectImpactScore: result.projectImpactScore,
    }));

    const savedResults = await ScreeningResult.insertMany(screeningDocs);

    // Update job screening stats
    await Job.findByIdAndUpdate(jobId, {
      screenedCount: candidates.length,
      shortlistedCount: aiResults.candidates.filter((c) => c.recommendation === 'hire').length,
    });

    res.json({
      message: `Screening complete. ${candidates.length} candidates evaluated.`,
      results: savedResults,
    });
  } catch (error: any) {
    console.error('Screening error:', error);
    res.status(500).json({
      error: 'AI screening failed. Please try again.',
      details: error.message,
    });
  }
};

export const getScreeningResults = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { minScore, recommendation } = req.query;

    const filter: any = { jobId };
    if (minScore) filter.score = { $gte: parseInt(minScore as string, 10) };
    if (recommendation) filter.recommendation = recommendation;

    const results = await ScreeningResult.find(filter)
      .sort({ rank: 1 })
      .populate('candidateId');

    const job = await Job.findById(jobId);

    res.json({
      job,
      results,
      totalCandidates: results.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getComparisonData = async (req: Request, res: Response) => {
  try {
    const { candidateIds, jobId } = req.query;

    if (!candidateIds || !jobId) {
      return res.status(400).json({ error: 'candidateIds and jobId are required' });
    }

    const ids = (candidateIds as string).split(',');
    const jobIdStr = jobId as string;

    const [results, job] = await Promise.all([
      ScreeningResult.find({
        jobId: jobIdStr,
        candidateId: { $in: ids } as any,
      }).populate('candidateId'),
      Job.findById(jobIdStr),
    ]);

    res.json({ job, candidates: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

