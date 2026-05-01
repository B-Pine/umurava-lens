import nodemailer, { Transporter } from 'nodemailer';
import { Resend } from 'resend';

type EmailMode = 'resend' | 'smtp' | 'ethereal';

let resendClient: Resend | null = null;
let cachedTransporter: Transporter | null = null;
let cachedMode: EmailMode | null = null;

async function resolveDriver(): Promise<EmailMode> {
  if (cachedMode) return cachedMode;

  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    cachedMode = 'resend';
    return cachedMode;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    cachedMode = 'smtp';
    return cachedMode;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'No email driver configured. Set RESEND_API_KEY (recommended) or SMTP_* env vars in production.'
    );
  }

  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  cachedMode = 'ethereal';
  console.log('[email] Using Ethereal test SMTP (dev fallback). Set RESEND_API_KEY for real delivery.');
  return cachedMode;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | null;
  isTestMode: boolean;
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const { to, subject, body, fromName = 'Umurava Talent Team' } = args;
  const mode = await resolveDriver();

  const fromAddressRaw =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    '"Umurava Lens" <onboarding@resend.dev>';
  const fromEmail = extractAddress(fromAddressRaw);
  const from = `"${fromName}" <${fromEmail}>`;

  if (mode === 'resend') {
    const { data, error } = await resendClient!.emails.send({
      from,
      to,
      subject,
      text: body,
      html: bodyToHtml(body),
    });
    if (error) {
      throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
    }
    return { messageId: data?.id || '', previewUrl: null, isTestMode: false };
  }

  const info = await cachedTransporter!.sendMail({
    from,
    to,
    subject,
    text: body,
    html: bodyToHtml(body),
  });
  const previewUrl = mode === 'ethereal' ? (nodemailer.getTestMessageUrl(info) || null) : null;
  return { messageId: info.messageId, previewUrl, isTestMode: mode === 'ethereal' };
}

function extractAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1] : raw;
}

function bodyToHtml(body: string): string {
  const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.6; color:#0f172a; max-width:600px;">${escaped
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')}</div>`;
}
