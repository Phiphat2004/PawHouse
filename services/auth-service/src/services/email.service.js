const { Resend } = require('resend');
const config = require('../config');

let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;
  if (!config.resend.apiKey) return null;
  resendClient = new Resend(config.resend.apiKey);
  return resendClient;
}

function getOtpEmailHtml(otp, type = 'verification') {
  const title = type === 'verification' 
    ? 'Mã xác thực tài khoản' 
    : 'Mã đặt lại mật khẩu';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #f97316;">🐾 PawHouse</h2>
      <p>Xin chào,</p>
      <p>${title} của bạn là:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f97316; margin: 24px 0;">
        ${otp}
      </div>
      <p style="color: #666;">Mã có hiệu lực trong ${config.otp.expiresMinutes} phút.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">© 2026 PawHouse</p>
    </div>
  `;
}

async function sendOtpEmail(toEmail, otp, type = 'verification') {
  const subject = type === 'verification' 
    ? '[PawHouse] Mã xác thực tài khoản'
    : '[PawHouse] Đặt lại mật khẩu';
  const html = getOtpEmailHtml(otp, type);

  const resend = getResendClient();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: `PawHouse <${config.resend.fromEmail}>`,
        to: toEmail,
        subject,
        html
      });
      if (!result.error) {
        console.log('[EMAIL] Sent to', toEmail);
        return { sent: true, provider: 'resend' };
      }
    } catch (err) {
      console.error('[EMAIL] Error:', err.message);
    }
  }

  // Dev mode
  console.log('[EMAIL-DEV] OTP for', toEmail, ':', otp);
  return { devMode: true, otp };
}

module.exports = { sendOtpEmail };
