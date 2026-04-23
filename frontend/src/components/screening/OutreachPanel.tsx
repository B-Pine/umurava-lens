'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import {
  ScreeningResult,
  updateEmailDraft,
  sendOutreachEmail,
} from '../../store/screeningSlice';

interface Props {
  result: ScreeningResult;
}

export default function OutreachPanel({ result }: Props) {
  const dispatch = useAppDispatch();
  const candidate = result.candidateId as any;

  const [subject, setSubject] = useState(result.emailSubject || '');
  const [body, setBody] = useState(result.emailDraft || '');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setSubject(result.emailSubject || '');
    setBody(result.emailDraft || '');
  }, [result._id, result.emailSubject, result.emailDraft]);

  const isSent = result.emailStatus === 'sent';
  const recipient = candidate?.email || '';
  const recipientName = [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ').trim();

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await dispatch(
        updateEmailDraft({ resultId: result._id, emailSubject: subject, emailDraft: body })
      ).unwrap();
      setFeedback('Draft saved.');
    } catch (err: any) {
      setFeedback(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!recipient) {
      setFeedback('This candidate has no email address on file.');
      return;
    }
    const confirmed = window.confirm(
      `Send this email to ${recipientName || recipient}?`
    );
    if (!confirmed) return;

    setSending(true);
    setFeedback(null);
    try {
      await dispatch(
        updateEmailDraft({ resultId: result._id, emailSubject: subject, emailDraft: body })
      ).unwrap();
      const res: any = await dispatch(
        sendOutreachEmail({
          screeningResultId: result._id,
          subject,
          body,
        })
      ).unwrap();
      setFeedback(
        res?.isTestMode
          ? 'Sent via Ethereal test SMTP. Click "View preview" to see the captured email.'
          : 'Email sent successfully.'
      );
      setPreviewUrl(res?.previewUrl || null);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-outline-variant/40 bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container-low flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Outreach email
          </h4>
          <p className="text-sm font-semibold text-on-surface mt-0.5">
            To: {recipientName || 'Unknown'}{' '}
            <span className="text-on-surface-variant font-normal">&lt;{recipient || 'no email'}&gt;</span>
          </p>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
            isSent
              ? 'bg-emerald-50 text-emerald-600'
              : result.emailStatus === 'failed'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          {isSent ? 'Sent' : result.emailStatus === 'failed' ? 'Send failed' : 'Pending review'}
        </span>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isSent}
            className="mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary/30 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSent}
            rows={Math.max(6, Math.min(14, body.split('\n').length + 1))}
            className="mt-1 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-secondary/30 disabled:opacity-60"
          />
        </div>

        {feedback && (
          <div className="text-xs font-semibold text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant/30">
            {feedback}
            {previewUrl && (
              <>
                {' '}
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-secondary underline"
                >
                  View preview
                </a>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || sending || isSent}
            className="px-4 py-2 rounded-lg border border-outline-variant/40 text-sm font-bold text-on-surface bg-surface-container-lowest hover:bg-surface-container disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>

          <button
            onClick={handleSend}
            disabled={sending || isSent || !recipient || !body.trim()}
            className="px-5 py-2 rounded-lg bg-secondary text-white text-sm font-bold shadow-md shadow-secondary/20 hover:bg-secondary/90 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            {sending ? 'Sending…' : isSent ? 'Already sent' : 'Send email'}
          </button>
        </div>
      </div>
    </div>
  );
}
