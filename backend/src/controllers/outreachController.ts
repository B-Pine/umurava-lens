import { Request, Response } from 'express';
import ScreeningResult from '../models/ScreeningResult';
import Candidate from '../models/Candidate';
import { sendEmail } from '../services/emailService';

export const sendOutreach = async (req: Request, res: Response) => {
  try {
    const { screeningResultId, to, subject, body } = req.body as {
      screeningResultId: string;
      to?: string;
      subject?: string;
      body?: string;
    };

    if (!screeningResultId) {
      return res.status(400).json({ error: 'screeningResultId is required' });
    }

    const result = await ScreeningResult.findById(screeningResultId).populate('candidateId');
    if (!result) return res.status(404).json({ error: 'Screening result not found' });

    const candidate = result.candidateId as any;
    const recipient = to || candidate?.email;
    if (!recipient) {
      return res.status(400).json({ error: 'No recipient email available for this candidate' });
    }

    const finalSubject = subject || result.emailSubject || 'Message from Umurava';
    const finalBody = body || result.emailDraft;
    if (!finalBody) {
      return res.status(400).json({ error: 'Email body is empty. Generate a draft first.' });
    }

    try {
      const send = await sendEmail({ to: recipient, subject: finalSubject, body: finalBody });
      result.emailDraft = finalBody;
      result.emailSubject = finalSubject;
      result.emailStatus = 'sent';
      result.emailSentAt = new Date();
      await result.save();

      res.json({
        success: true,
        messageId: send.messageId,
        previewUrl: send.previewUrl,
        isTestMode: send.isTestMode,
        result,
      });
    } catch (err: any) {
      result.emailStatus = 'failed';
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
    const { screeningResultIds } = req.body as { screeningResultIds: string[] };
    if (!Array.isArray(screeningResultIds) || screeningResultIds.length === 0) {
      return res.status(400).json({ error: 'screeningResultIds array is required' });
    }

    const results = await ScreeningResult.find({ _id: { $in: screeningResultIds } }).populate(
      'candidateId'
    );

    const outcomes = [] as any[];

    for (const result of results) {
      const candidate = result.candidateId as any;
      const recipient = candidate?.email;
      if (!recipient || !result.emailDraft) {
        outcomes.push({
          id: String(result._id),
          status: 'skipped',
          reason: !recipient ? 'No email address' : 'No draft content',
        });
        continue;
      }
      try {
        const send = await sendEmail({
          to: recipient,
          subject: result.emailSubject || 'Message from Umurava',
          body: result.emailDraft,
        });
        result.emailStatus = 'sent';
        result.emailSentAt = new Date();
        await result.save();
        outcomes.push({ id: String(result._id), status: 'sent', previewUrl: send.previewUrl });
      } catch (err: any) {
        result.emailStatus = 'failed';
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
