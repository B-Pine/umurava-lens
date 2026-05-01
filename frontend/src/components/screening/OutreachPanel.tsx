'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import {
  ScreeningResult,
  updateEmailDraft,
  sendOutreachEmail,
  type OutreachPhase,
} from '../../store/screeningSlice';

interface Props {
  result: ScreeningResult;
  variant?: 'outreach' | 'rejection' | 'offer';
  phase?: OutreachPhase;
}

export default function OutreachPanel({ result, variant = 'outreach', phase = 'invitation' }: Props) {
  const dispatch = useAppDispatch();
  const candidate = result.candidateId as any;

  const isPostInterview = phase === 'post_interview';
  const initialSubject = isPostInterview ? result.postInterviewEmailSubject : result.emailSubject;
  const initialBody = isPostInterview ? result.postInterviewEmailDraft : result.emailDraft;
  const status = isPostInterview ? result.postInterviewEmailStatus : result.emailStatus;

  const [subject, setSubject] = useState(initialSubject || '');
  const [body, setBody] = useState(initialBody || '');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setSubject(initialSubject || '');
    setBody(initialBody || '');
  }, [result._id, initialSubject, initialBody]);

  const isSent = status === 'sent';
  const recipient = candidate?.email || '';
  const recipientName = [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ').trim();

  const accent = variant === 'rejection' ? 'rose' : variant === 'offer' ? 'emerald' : 'indigo';
  const iconBg =
    accent === 'rose' ? 'bg-rose-50' : accent === 'emerald' ? 'bg-emerald-50' : 'bg-indigo-50';
  const iconColor =
    accent === 'rose'
      ? 'text-rose-600'
      : accent === 'emerald'
        ? 'text-emerald-600'
        : 'text-indigo-600';
  const sendButtonStyle =
    accent === 'rose'
      ? 'bg-gradient-to-b from-rose-500 to-rose-600 shadow-[0_4px_12px_-4px_rgba(244,63,94,0.5),inset_0_1px_0_0_rgba(255,255,255,0.22)]'
      : accent === 'emerald'
        ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.5),inset_0_1px_0_0_rgba(255,255,255,0.22)]'
        : 'bg-gradient-to-b from-indigo-500 to-indigo-600 shadow-[0_4px_12px_-4px_rgba(70,72,212,0.5),inset_0_1px_0_0_rgba(255,255,255,0.22)]';

  const headerLabel =
    variant === 'offer'
      ? 'Offer Email'
      : variant === 'rejection'
        ? isPostInterview
          ? 'Post-interview Decline'
          : 'Rejection Email'
        : 'Outreach Email';

  const headerIcon =
    variant === 'offer' ? 'celebration' : variant === 'rejection' ? 'mark_email_unread' : 'forward_to_inbox';

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await dispatch(
        updateEmailDraft({ resultId: result._id, emailSubject: subject, emailDraft: body, phase })
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
    const confirmed = window.confirm(`Send this email to ${recipientName || recipient}?`);
    if (!confirmed) return;

    setSending(true);
    setFeedback(null);
    try {
      await dispatch(
        updateEmailDraft({ resultId: result._id, emailSubject: subject, emailDraft: body, phase })
      ).unwrap();
      const res: any = await dispatch(
        sendOutreachEmail({ screeningResultId: result._id, subject, body, phase })
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
    <div className="bg-white/70 border border-slate-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md ${iconBg} flex items-center justify-center`}>
            <span className={`material-symbols-outlined text-[13px] ${iconColor}`}>
              {headerIcon}
            </span>
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold text-slate-900">{headerLabel}</p>
            <p className="text-[9px] text-slate-500 font-medium">
              To: {recipientName || 'Unknown'} &lt;{recipient || 'no email'}&gt;
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              isSent
                ? 'bg-emerald-50 text-emerald-600'
                : status === 'failed'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isSent ? 'Sent' : status === 'failed' ? 'Failed' : 'Draft'}
          </span>
          <span
            className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform ${
              !collapsed ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-slate-100/60">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSent}
              className="mt-0.5 w-full bg-white border border-slate-200 rounded-md px-2.5 h-7 text-[11px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSent}
              rows={Math.max(4, Math.min(10, body.split('\n').length + 1))}
              className="mt-0.5 w-full bg-white border border-slate-200 rounded-md px-2.5 py-2 text-[11px] font-medium text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 disabled:opacity-50"
            />
          </div>

          {feedback && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-slate-50 border border-slate-200">
              <span className="material-symbols-outlined text-[12px] text-slate-500 mt-0.5 shrink-0">info</span>
              <p className="text-[10px] font-medium text-slate-600">
                {feedback}
                {previewUrl && (
                  <>
                    {' '}
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                      View preview
                    </a>
                  </>
                )}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || sending || isSent}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving...' : 'Save draft'}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || isSent || !recipient || !body.trim()}
              className={`inline-flex items-center gap-1 h-7 px-3 rounded-md text-white text-[10px] font-semibold disabled:opacity-40 transition press ${sendButtonStyle}`}
            >
              <span className="material-symbols-outlined text-[12px]">send</span>
              {sending ? 'Sending...' : isSent ? 'Sent' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
