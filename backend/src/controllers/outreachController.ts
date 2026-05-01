import { Request, Response } from 'express';
import ScreeningResult, { type IScreeningResult } from '../models/ScreeningResult';
import { sendEmail } from '../services/emailService';

type Phase = 'invitation' | 'post_interview';

interface PhaseFields {
  draftField: 'emailDraft' | 'postInterviewEmailDraft';
  subjectField: 'emailSubject' | 'postInterviewEmailSubject';
  statusField: 'emailStatus' | 'postInterviewEmailStatus';
  sentAtField: 'emailSentAt' | 'postInterviewEmailSentAt';
}

function fieldsForPhase(phase: Phase): PhaseFields {
  if (phase === 'post_interview') {
    return {
      draftField: 'postInterviewEmailDraft',
      subjectField: 'postInterviewEmailSubject',
      statusField: 'postInterviewEmailStatus',
      sentAtField: 'postInterviewEmailSentAt',
    };
  }
  return {
    draftField: 'emailDraft',
    subjectField: 'emailSubject',
    statusField: 'emailStatus',
    sentAtField: 'emailSentAt',
  };
}

function validatePhaseTransition(result: IScreeningResult, phase: Phase): string | null {
  if (phase !== 'post_interview') return null;
  if (result.emailStatus !== 'sent') {
    return 'Interview invitation must be sent before sending a post-interview email.';
  }
  if (result.interviewStatus === 'pending') {
    return 'Record an interview decision (passed / failed / no show) before sending the post-interview email.';
  }
  return null;
}

export const sendOutreach = async (req: Request, res: Response) => {
  try {
    const { screeningResultId, to, subject, body, phase = 'invitation' } = req.body as {
      screeningResultId: string;
      to?: string;
      subject?: string;
      body?: string;
      phase?: Phase;
    };

    if (!screeningResultId) {
      return res.status(400).json({ error: 'screeningResultId is required' });
    }
    if (phase !== 'invitation' && phase !== 'post_interview') {
      return res.status(400).json({ error: "phase must be 'invitation' or 'post_interview'" });
    }

    const result = await ScreeningResult.findById(screeningResultId).populate('candidateId');
    if (!result) return res.status(404).json({ error: 'Screening result not found' });

    const transitionError = validatePhaseTransition(result, phase);
    if (transitionError) return res.status(409).json({ error: transitionError });

    const candidate = result.candidateId as any;
    const recipient = to || candidate?.email;
    if (!recipient) {
      return res.status(400).json({ error: 'No recipient email available for this candidate' });
    }

    const f = fieldsForPhase(phase);
    const finalSubject = subject || result[f.subjectField] || 'Message from Umurava';
    const finalBody = body || result[f.draftField];
    if (!finalBody) {
      return res.status(400).json({ error: 'Email body is empty. Generate a draft first.' });
    }

    try {
      const send = await sendEmail({ to: recipient, subject: finalSubject, body: finalBody });
      result[f.draftField] = finalBody;
      result[f.subjectField] = finalSubject;
      result[f.statusField] = 'sent';
      result[f.sentAtField] = new Date();
      await result.save();

      res.json({
        success: true,
        messageId: send.messageId,
        previewUrl: send.previewUrl,
        isTestMode: send.isTestMode,
        result,
      });
    } catch (err: any) {
      result[f.statusField] = 'failed';
      await result.save();
      throw err;
    }
  } catch (error: any) {
    console.error('Outreach send error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
};

export const sendOutreachBatch = async (req: Request, res: Response) => {
  try {
    const { screeningResultIds, phase = 'invitation' } = req.body as {
      screeningResultIds: string[];
      phase?: Phase;
    };
    if (!Array.isArray(screeningResultIds) || screeningResultIds.length === 0) {
      return res.status(400).json({ error: 'screeningResultIds array is required' });
    }
    if (phase !== 'invitation' && phase !== 'post_interview') {
      return res.status(400).json({ error: "phase must be 'invitation' or 'post_interview'" });
    }

    const results = await ScreeningResult.find({ _id: { $in: screeningResultIds } }).populate(
      'candidateId'
    );

    const f = fieldsForPhase(phase);
    const outcomes = [] as any[];

    for (const result of results) {
      const candidate = result.candidateId as any;
      const recipient = candidate?.email;
      const draft = result[f.draftField];
      const skipReason =
        !recipient
          ? 'No email address'
          : !draft
            ? 'No draft content'
            : validatePhaseTransition(result, phase);

      if (skipReason) {
        outcomes.push({ id: String(result._id), status: 'skipped', reason: skipReason });
        continue;
      }
      try {
        const send = await sendEmail({
          to: recipient,
          subject: result[f.subjectField] || 'Message from Umurava',
          body: draft,
        });
        result[f.statusField] = 'sent';
        result[f.sentAtField] = new Date();
        await result.save();
        outcomes.push({ id: String(result._id), status: 'sent', previewUrl: send.previewUrl });
      } catch (err: any) {
        result[f.statusField] = 'failed';
        await result.save();
        outcomes.push({ id: String(result._id), status: 'failed', error: err.message });
      }
    }

    res.json({
      total: results.length,
      sent: outcomes.filter((o) => o.status === 'sent').length,
      failed: outcomes.filter((o) => o.status === 'failed').length,
      skipped: outcomes.filter((o) => o.status === 'skipped').length,
      outcomes,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
