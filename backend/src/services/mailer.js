const nodemailer = require("nodemailer");

const smtpEnabled = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);

const createTransporter = () => {
  if (!smtpEnabled()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
};

const buildResetEmail = ({ resetUrl }) => {
  const brand = process.env.MAIL_BRAND || "JobFlow";
  const support = process.env.MAIL_SUPPORT || "";

  const text = `You requested a password reset for ${brand}.
Use this link within 1 hour:
${resetUrl}

If you didn't request this, you can ignore this email.`;

  const html = `
    <div style="background:#f8fafc;padding:32px 16px;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="padding:20px 24px;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#ffffff;">
          <h1 style="margin:0;font-size:20px;letter-spacing:0.5px;">${brand}</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Password reset request</p>
        </div>
        <div style="padding:24px;">
          <h2 style="margin:0 0 8px;font-size:18px;">Reset your password</h2>
          <p style="margin:0 0 16px;line-height:1.5;color:#334155;">
            We received a request to reset your ${brand} password. This link is valid for 1 hour.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:600;">
            Reset Password
          </a>
          <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
            If the button doesn't work, paste this URL into your browser:
          </p>
          <p style="margin:6px 0 0;font-size:12px;color:#475569;word-break:break-all;">
            ${resetUrl}
          </p>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;">
          <div>Didn't request this? You can ignore this email.</div>
          ${
            support
              ? `<div style="margin-top:6px;">Support: ${support}</div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  return { text, html, subject: `Reset your ${brand} password` };
};

const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS."
    );
  }

  const from = process.env.FROM_EMAIL || "JobFlow <no-reply@jobflow.local>";
  const { text, html, subject } = buildResetEmail({ resetUrl });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendPasswordResetEmail,
  smtpEnabled,
};
