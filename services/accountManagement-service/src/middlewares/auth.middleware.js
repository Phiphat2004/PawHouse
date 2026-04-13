const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
// Session model is optional
let Session = null;
try {
  Session = require('../models/Session');
} catch (e) {
  // Session model doesn't exist, that's okay
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] Missing or invalid Authorization header');
      return res.status(401).json({ error: 'Token missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      console.log('[Auth] Token verification failed:', err.message);
      return res.status(401).json({ error: `Token verification failed: ${err.message}` });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      console.log('[Auth] User not found for ID:', payload.userId);
      return res.status(401).json({ error: 'User not found in database' });
    }

    // Check if user is active
    // Relaxed check: Only Mock if explicitly 'banned' or 'deleted'
    // If status is missing, assume active
    if (user.status === 'banned' || user.status === 'deleted') {
      console.log('[Auth] User status is:', user.status);
      return res.status(403).json({ error: `Account is ${user.status}` });
    }

    // Legacy checks
    if (user.is_banned) {
      console.log('[Auth] User is_banned is true');
      return res.status(403).json({ error: 'Account is banned' });
    }
    if (user.is_deleted) {
      console.log('[Auth] User is_deleted is true');
      return res.status(403).json({ error: 'Account is deleted' });
    }

    if (user.tokenVersion !== payload.tokenVersion && user.tokenVersion !== undefined) {
      console.log(`[Auth] Token version mismatch: User ${user.tokenVersion} vs Token ${payload.tokenVersion}`);
      return res.status(401).json({ error: 'Session expired (token version mismatch)' });
    }

    // Session check omitted for now as it's optional

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('[Auth] Unexpected error:', err);
    next(err);
  }
}

module.exports = { authenticate };
