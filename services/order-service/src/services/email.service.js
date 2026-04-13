const config = require('../config');

let resendClient = null;

/**
 * Resend API client (same as auth-service) — primary provider.
 */
function getResendClient() {
  if (resendClient) return resendClient;
  const apiKey = config.email.resendApiKey;
  if (!apiKey) return null;
  try {
    const { Resend } = require('resend');
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch {
    return null;
  }
}

/**
 * Send email via Resend API.
 */
async function sendEmail({ to, subject, html }) {
  // Try Resend first
  const resend = getResendClient();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: config.email.from,
        to,
        subject,
        html
      });
      if (result.error) {
        console.error('[EMAIL-RESEND] Error:', result.error.message);
      } else {
        console.log(`[EMAIL-RESEND] Sent to ${to}: "${subject}"`);
        return true;
      }
    } catch (err) {
      console.error('[EMAIL-RESEND] Error:', err.message);
    }
  }

  // Resend API error or not configured
  console.warn(`[EMAIL] Resend not configured or failed — skipping email to ${to}`);
  return false;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(n) {
  return Number(n || 0).toLocaleString('vi-VN') + '₫';
}

function formatDate(d) {
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

const STATUS_LABELS = {
  pending:   'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  packing:   'Đang đóng gói',
  shipping:  'Đang giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  refunded:  'Đã hoàn tiền'
};

const STATUS_COLORS = {
  pending:   '#f59e0b',
  confirmed: '#3b82f6',
  packing:   '#8b5cf6',
  shipping:  '#6366f1',
  completed: '#22c55e',
  cancelled: '#ef4444',
  refunded:  '#6b7280'
};

// ─── HTML Templates ──────────────────────────────────────────────────────────

function baseLayout(body) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr><td style="background:#846551;padding:28px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:1px;">🐾 PawCare</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">${body}</td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f7f5;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 PawCare. Cảm ơn bạn đã tin tưởng chúng tôi 🐾</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function itemRows(items = []) {
  return items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
        ${item.productName || 'Sản phẩm'}${item.variationName ? ` <span style="color:#9ca3af;">(${item.variationName})</span>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:center;">x${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:right;">${formatPrice(item.lineTotal)}</td>
    </tr>`).join('');
}

function orderSummaryTable(order) {
  const addr = order.addressSnapshot || {};
  const fullAddr = [addr.addressLine, addr.ward, addr.district, addr.city].filter(Boolean).join(', ');
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-top:20px;">
      <thead>
        <tr style="background:#f9f7f5;">
          <th style="padding:10px 14px;font-size:13px;color:#6b7280;text-align:left;">Sản phẩm</th>
          <th style="padding:10px 14px;font-size:13px;color:#6b7280;text-align:center;">SL</th>
          <th style="padding:10px 14px;font-size:13px;color:#6b7280;text-align:right;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>${itemRows(order.items)}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding:8px 14px;font-size:13px;color:#6b7280;">Tạm tính</td>
            <td style="padding:8px 14px;font-size:13px;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
        <tr><td colspan="2" style="padding:8px 14px;font-size:13px;color:#6b7280;">Phí vận chuyển</td>
            <td style="padding:8px 14px;font-size:13px;text-align:right;">${formatPrice(order.shippingFee)}</td></tr>
        <tr style="background:#f9f7f5;">
          <td colspan="2" style="padding:12px 14px;font-size:15px;font-weight:bold;color:#374151;">Tổng cộng</td>
          <td style="padding:12px 14px;font-size:15px;font-weight:bold;color:#846551;text-align:right;">${formatPrice(order.total)}</td>
        </tr>
      </tfoot>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
      <tr>
        <td width="50%" valign="top" style="padding-right:10px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#374151;">Địa chỉ giao hàng</p>
          <p style="margin:0;font-size:13px;color:#6b7280;">${addr.fullName || ''}<br/>${addr.phone || ''}<br/>${fullAddr}</p>
        </td>
        <td width="50%" valign="top" style="padding-left:10px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#374151;">Thanh toán</p>
          <p style="margin:0;font-size:13px;color:#6b7280;">Thanh toán khi nhận hàng (COD)</p>
        </td>
      </tr>
    </table>`;
}

// ─── Exported Functions ───────────────────────────────────────────────────────

/**
 * Send order confirmation email after a new order is placed.
 * @param {object} order  - The saved Order document (.toObject())
 * @param {string} toEmail
 */
exports.sendOrderConfirmation = async (order, toEmail) => {
  if (!toEmail) return;

  const body = `
    <h2 style="margin:0 0 8px;color:#374151;font-size:20px;">Đặt hàng thành công! 🎉</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">
      Xin chào <strong>${order.addressSnapshot?.fullName || 'bạn'}</strong>,
      đơn hàng của bạn đã được tiếp nhận và đang chờ xác nhận.
    </p>
    <div style="background:#f9f7f5;border-radius:8px;padding:14px 18px;display:inline-block;margin-bottom:20px;">
      <span style="font-size:13px;color:#6b7280;">Mã đơn hàng: </span>
      <strong style="font-size:16px;color:#846551;">${order.orderCode}</strong>
      &nbsp;&nbsp;
      <span style="font-size:12px;color:#9ca3af;">${formatDate(order.createdAt)}</span>
    </div>
    ${orderSummaryTable(order)}
    <p style="margin:28px 0 0;font-size:14px;color:#6b7280;">
      Chúng tôi sẽ liên hệ với bạn qua số điện thoại <strong>${order.addressSnapshot?.phone || ''}</strong>
      để xác nhận đơn hàng sớm nhất.
    </p>`;

  await sendEmail({
    to: toEmail,
    subject: `[PawCare] Xác nhận đơn hàng #${order.orderCode}`,
    html: baseLayout(body)
  });
};

/**
 * Send order status update email when admin changes the order status.
 * @param {object} order  - The updated Order document (.toObject())
 * @param {string} toEmail
 */
exports.sendOrderStatusUpdate = async (order, toEmail) => {
  if (!toEmail) return;

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusColor = STATUS_COLORS[order.status] || '#846551';

  const messages = {
    confirmed: 'Đơn hàng của bạn đã được xác nhận. Chúng tôi đang chuẩn bị hàng cho bạn.',
    packing:   'Đơn hàng của bạn đang được đóng gói cẩn thận và sẽ sớm được bàn giao cho đơn vị vận chuyển.',
    shipping:  'Đơn hàng của bạn đã được bàn giao cho đơn vị vận chuyển và đang trên đường đến bạn. Vui lòng chú ý điện thoại!',
    completed: 'Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã tin tưởng và mua sắm tại PawCare! 🐾',
    cancelled: 'Đơn hàng của bạn đã bị hủy. Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi để được hỗ trợ.',
    refunded:  'Chúng tôi đã tiến hành hoàn tiền cho đơn hàng của bạn. Vui lòng kiểm tra tài khoản trong vòng 3–5 ngày làm việc.'
  };

  const body = `
    <h2 style="margin:0 0 8px;color:#374151;font-size:20px;">Cập nhật đơn hàng</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">
      Xin chào <strong>${order.addressSnapshot?.fullName || 'bạn'}</strong>,
      trạng thái đơn hàng của bạn vừa được cập nhật.
    </p>
    <div style="background:#f9f7f5;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <span style="font-size:13px;color:#6b7280;">Mã đơn hàng: </span>
      <strong style="font-size:16px;color:#846551;">${order.orderCode}</strong>
    </div>
    <div style="text-align:center;padding:20px;background:#f9f7f5;border-radius:8px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Trạng thái mới</p>
      <span style="display:inline-block;background:${statusColor};color:#fff;padding:8px 24px;border-radius:20px;font-size:15px;font-weight:bold;">
        ${statusLabel}
      </span>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${messages[order.status] || ''}</p>
    ${orderSummaryTable(order)}`;

  await sendEmail({
    to: toEmail,
    subject: `[PawCare] Đơn hàng #${order.orderCode} — ${statusLabel}`,
    html: baseLayout(body)
  });
};
