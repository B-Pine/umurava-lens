import { Request, Response } from 'express';
import Job from '../models/Job';
import Candidate from '../models/Candidate';
import ScreeningResult from '../models/ScreeningResult';
import { screenCandidates } from '../services/geminiService';
import { buildPostInterviewDraft } from '../services/postInterviewTemplates';

export const runScreening = async (req: Request, res: Response) => {
  try {
    const { jobId, candidateIds } = req.body as {
      jobId: string;
      candidateIds?: string[];
    };

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // If specific candidates selected, only screen those. Otherwise all for this job.
    const filter: any = { jobId };
    if (Array.isArray(candidateIds) && candidateIds.length > 0) {
      filter._id = { $in: candidateIds };
    }
    const candidates = await Candidate.find(filter);
    if (candidates.length === 0) {
      return res.status(400).json({ error: 'No candidates found for this job' });
    }

    const aiResults = await screenCandidates(job, candidates);

    // Normalize + sort by rank
    const sorted = [...aiResults.candidates].sort((a, b) => a.rank - b.rank);

    // Apply Top-N shortlist cap AND passing score
    const passingScore = job.passingScore ?? 70;
    const cap = job.shortlistCap ?? 20;

    const shortlistedIds = new Set(
      sorted
        .filter((r) => r.score >= passingScore)
        .slice(0, cap)
        .map((r) => r.candidateId)
    );

    // Clear existing results for this job so re-runs are clean
    await ScreeningResult.deleteMany({ jobId });

    const screeningDocs = sorted.map((result) => ({
      jobId,
      candidateId: result.candidateId,
      score: result.score,
      rank: result.rank,
      strengths: result.strengths || [],
      gaps: result.gaps || [],
      summary: result.summary || '',
      recommendation: result.recommendation,
      confidence: result.confidence || 0,
      technicalSkillsScore: result.technicalSkillsScore || 0,
      experienceScore: result.experienceScore || 0,
      educationScore: result.educationScore || 0,
      projectImpactScore: result.projectImpactScore || 0,
      shortlisted: shortlistedIds.has(result.candidateId),
      emailDraft: result.emailDraft || '',
      emailSubject: result.emailSubject || '',
      emailStatus: 'not_sent',
      emailSentAt: null,
    }));

    const savedResults = await ScreeningResult.insertMany(screeningDocs);

    await Job.findByIdAndUpdate(jobId, {
      screenedCount: candidates.length,
      shortlistedCount: shortlistedIds.size,
    });

    res.json({
      message: `Screening complete. ${candidates.length} evaluated, ${shortlistedIds.size} shortlisted.`,
      results: savedResults,
    });
  } catch (error: any) {
    console.error('Screening error:', error);
    
    let friendlyMessage = 'AI screening failed. Please try again.';
    let statusCode = 500;

    // Provide friendly messages for common Gemini upstream errors
    if (error.message?.includes('503 Service Unavailable') || error.message?.includes('overload')) {
      friendlyMessage = 'Google AI models are currently experiencing extremely high demand. Please try again in a few moments.';
      statusCode = 503;
    } else if (error.message?.includes('429 Too Many Requests')) {
      friendlyMessage = 'AI request limit reached. Please wait a moment and try again.';
      statusCode = 429;
    } else if (error.message?.includes('JSON')) {
      friendlyMessage = 'AI returned an unexpected format. Please try screening again.';
    }

    res.status(statusCode).json({
      error: friendlyMessage,
      details: error.message,
    });
  }
};

export const getScreeningResults = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { minScore, recommendation, shortlistedOnly } = req.query;

    const filter: any = { jobId };
    if (minScore) filter.score = { $gte: parseInt(minScore as string, 10) };
    if (recommendation) filter.recommendation = recommendation;
    if (shortlistedOnly === 'true') filter.shortlisted = true;

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

export const getShortlisted = async (_req: Request, res: Response) => {
  try {
    const results = await ScreeningResult.find({ shortlisted: true })
      .sort({ score: -1 })
      .populate('candidateId')
      .populate('jobId');
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmailDraft = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { emailDraft, emailSubject, phase } = req.body as {
      emailDraft?: string;
      emailSubject?: string;
      phase?: 'invitation' | 'post_interview';
    };
    const patch: any = {};
    if (phase === 'post_interview') {
      if (typeof emailDraft === 'string') patch.postInterviewEmailDraft = emailDraft;
      if (typeof emailSubject === 'string') patch.postInterviewEmailSubject = emailSubject;
    } else {
      if (typeof emailDraft === 'string') patch.emailDraft = emailDraft;
      if (typeof emailSubject === 'string') patch.emailSubject = emailSubject;
    }

    const updated = await ScreeningResult.findByIdAndUpdate(id, patch, { new: true }).populate(
      'candidateId'
    );
    if (!updated) return res.status(404).json({ error: 'Screening result not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const setInterviewDecision = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision } = req.body as { decision?: string };

    if (decision !== 'passed' && decision !== 'failed' && decision !== 'no_show') {
      return res.status(400).json({ error: "decision must be 'passed', 'failed', or 'no_show'" });
    }

    const result = await ScreeningResult.findById(id).populate('candidateId');
    if (!result) return res.status(404).json({ error: 'Screening result not found' });

    if (result.emailStatus !== 'sent') {
      return res
        .status(409)
        .json({ error: 'Interview invitation must be sent before recording an outcome.' });
    }

    if (result.postInterviewEmailStatus === 'sent') {
      return res.status(409).json({
        error: 'Post-interview email already sent. Decision cannot be changed after delivery.',
      });
    }

    const candidate = result.candidateId as any;
    const job = await Job.findById(result.jobId);
    const draft = buildPostInterviewDraft({
      firstName: candidate?.firstName || '',
      jobTitle: job?.title || '',
      decision,
    });

    result.interviewStatus = decision;
    result.interviewDecisionAt = new Date();
    result.postInterviewEmailSubject = draft.subject;
    result.postInterviewEmailDraft = draft.body;
    result.postInterviewEmailStatus = 'not_sent';
    result.postInterviewEmailSentAt = null;
    await result.save();

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
