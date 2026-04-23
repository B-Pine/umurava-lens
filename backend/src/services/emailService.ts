import nodemailer, { Transporter } from 'nodemailer';

let cachedTransporter: Transporter | null = null;
let cachedIsEthereal = false;

async function buildTransporter(): Promise<{ transporter: Transporter; isEthereal: boolean }> {
  if (cachedTransporter) {
    return { transporter: cachedTransporter, isEthereal: cachedIsEthereal };
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
    cachedIsEthereal = false;
  } else {
    // Dev fallback: Ethereal test inbox — returns preview URLs instead of real delivery.
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    cachedIsEthereal = true;
    console.log('[email] Using Ethereal test SMTP (no real delivery). Set SMTP_* env vars for production.');
  }

  return { transporter: cachedTransporter, isEthereal: cachedIsEthereal };
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
  const { transporter, isEthereal } = await buildTransporter();

  const fromAddress = process.env.SMTP_FROM || '"Umurava Lens" <no-reply@umurava.africa>';
  const from = fromName ? `"${fromName}" <${extractAddress(fromAddress)}>` : fromAddress;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: body,
    html: bodyToHtml(body),
  });

  const previewUrl = isEthereal ? (nodemailer.getTestMessageUrl(info) || null) : null;
  return { messageId: info.messageId, previewUrl, isTestMode: isEthereal };
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
