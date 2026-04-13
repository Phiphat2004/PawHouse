function errorHandler(err, req, res, next) {
  // Log full error stack when available to aid debugging
  if (err && err.stack) {
    console.error('[ERROR]', err.stack);
  } else {
    console.error('[ERROR]', err && err.message ? err.message : err);
  }

  // Custom error with status
  if (err.status) {
    const response = { error: err.message };
    if (err.data) Object.assign(response, err.data);
    return res.status(err.status).json(response);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join('. ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `${field} đã tồn tại` });
  }

  // Default - include more info in development
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ error: err.message || 'Internal Server Error', stack: err.stack });
  }

  res.status(500).json({ error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
}

module.exports = { errorHandler };
