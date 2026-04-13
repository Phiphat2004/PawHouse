/**
 * Global error handler middleware.
 * Xử lý tất cả các loại lỗi thường gặp trong ứng dụng.
 * Phải được đặt cuối cùng trong chuỗi middleware của Express.
 */
function errorHandler(err, req, res, next) {
  // Log đầy đủ stack trace để dễ debug
  if (err && err.stack) {
    console.error('[ERROR]', err.stack);
  } else {
    console.error('[ERROR]', err && err.message ? err.message : err);
  }

  // Custom AppError với status code rõ ràng
  if (err.status) {
    const response = { error: err.message };
    if (err.data) Object.assign(response, err.data);
    return res.status(err.status).json(response);
  }

  // Mongoose: Lỗi validation (required, minlength, ...)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join('. ') });
  }

  // Mongoose: Duplicate key (unique index)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `${field} đã tồn tại` });
  }

  // Mongoose: CastError (sai định dạng ObjectId, ...)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID không hợp lệ' });
  }

  // Default — trả về stack trace khi development để tiện debug
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: err.message || 'Internal Server Error',
      stack: err.stack,
    });
  }

  res.status(500).json({ error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
}

module.exports = { errorHandler };
