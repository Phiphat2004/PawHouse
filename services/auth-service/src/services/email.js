const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const config = require('../config');

let transporter = null;
let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;
  if (!config.resend.apiKey) return null;
  resendClient = new Resend(config.resend.apiKey);
  return resendClient;
}

function getTransporter() {
  if (transporter) return transporter;
  const { host, port, user, pass } = config.smtp || {};
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10) || 587,
    secure: port === '465',
    auth: { user, pass }
  });
  return transporter;
}

function getOtpEmailHtml(otp) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #f97316;">🐾 PawHouse</h2>
      <p>Xin chào,</p>
      <p>Mã OTP xác thực tài khoản của bạn là:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f97316; margin: 24px 0;">
        ${otp}
      </div>
      <p style="color: #666;">Mã có hiệu lực trong ${config.otp.expiresMinutes} phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">© 2026 PawHouse</p>
    </div>
  `;
}

async function sendOtpEmail(toEmail, otp) {
  const subject = `[PawHouse] Mã xác thực tài khoản`;
  const html = getOtpEmailHtml(otp);

  const resend = getResendClient();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: `PawHouse <${config.resend.fromEmail}>`,
        to: toEmail,
        subject,
        html
      });
      if (result.error) {
        console.error('[EMAIL-RESEND] Error:', result.error.message);
      } else {
        console.log('[EMAIL-RESEND] Sent OTP to', toEmail);
        return { sent: true, provider: 'resend' };
      }
    } catch (err) {
      console.error('[EMAIL-RESEND] Error:', err.message);
    }
  }

  const smtp = getTransporter();
  if (smtp) {
    try {
      await smtp.sendMail({
        from: config.smtp?.from || config.smtp?.user,
        to: toEmail,
        subject,
        html
      });
      console.log('[EMAIL-SMTP] Sent OTP to', toEmail);
      return { sent: true, provider: 'smtp' };
    } catch (err) {
      console.error('[EMAIL-SMTP] Error:', err.message);
    }
  }

  console.log('[EMAIL-DEV] No email config. OTP for', toEmail, ':', otp);
  return { devMode: true, otp };
}

function getPasswordResetEmailHtml(otp) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #f97316;">🐾 PawHouse</h2>
      <p>Xin chào,</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f97316; margin: 24px 0;">
        ${otp}
      </div>
      <p style="color: #666;">Mã có hiệu lực trong ${config.otp.expiresMinutes} phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">© 2026 PawHouse</p>
    </div>
  `;
}

async function sendPasswordResetEmail(toEmail, otp) {
  const subject = `[PawHouse] Đặt lại mật khẩu`;
  const html = getPasswordResetEmailHtml(otp);

  const resend = getResendClient();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: `PawHouse <${config.resend.fromEmail}>`,
        to: toEmail,
        subject,
        html
      });
      if (result.error) {
        console.error('[EMAIL-RESEND] Error:', result.error.message);
      } else {
        console.log('[EMAIL-RESEND] Sent password reset OTP to', toEmail);
        return { sent: true, provider: 'resend' };
      }
    } catch (err) {
      console.error('[EMAIL-RESEND] Error:', err.message);
    }
  }

  const smtp = getTransporter();
  if (smtp) {
    try {
      await smtp.sendMail({
        from: config.smtp?.from || config.smtp?.user,
        to: toEmail,
        subject,
        html
      });
      console.log('[EMAIL-SMTP] Sent password reset OTP to', toEmail);
      return { sent: true, provider: 'smtp' };
    } catch (err) {
      console.error('[EMAIL-SMTP] Error:', err.message);
    }
  }

  console.log('[EMAIL-DEV] No email config. Password reset OTP for', toEmail, ':', otp);
  return { devMode: true, otp };
}

module.exports = { sendOtpEmail, sendPasswordResetEmail };

