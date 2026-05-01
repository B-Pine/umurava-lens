import type { InterviewStatus } from '../models/ScreeningResult';

interface TemplateInput {
  firstName: string;
  jobTitle: string;
  decision: Exclude<InterviewStatus, 'pending'>;
}

interface TemplateOutput {
  subject: string;
  body: string;
}

export function buildPostInterviewDraft({ firstName, jobTitle, decision }: TemplateInput): TemplateOutput {
  const name = (firstName || '').trim() || 'there';
  const role = (jobTitle || '').trim() || 'the role';

  if (decision === 'passed') {
    return {
      subject: `Update on your ${role} interview`,
      body:
        `Hi ${name},\n\n` +
        `Thank you for taking the time to interview with us for the ${role} role. We were impressed with your experience and we'd like to move forward.\n\n` +
        `We'll be in touch shortly with the next steps.\n\n` +
        `Warmly,\nThe Umurava Talent Team`,
    };
  }

  if (decision === 'failed') {
    return {
      subject: `Update on your ${role} application`,
      body:
        `Hi ${name},\n\n` +
        `Thank you for interviewing with us for the ${role} role. After careful consideration, we won't be moving forward at this time.\n\n` +
        `We genuinely appreciate the time you invested in the process and wish you the very best in your search. We'd love to keep you in mind for future roles that match your background.\n\n` +
        `Warmly,\nThe Umurava Talent Team`,
    };
  }

  return {
    subject: `We missed you — let's reschedule`,
    body:
      `Hi ${name},\n\n` +
      `We noticed we missed each other for our scheduled ${role} interview. These things happen — if you're still interested, just reply and we'll find a time that works.\n\n` +
      `Warmly,\nThe Umurava Talent Team`,
  };
}
