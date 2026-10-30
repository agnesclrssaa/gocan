const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  const authorization = req.get('authorization');
  const [scheme, token] = authorization?.split(' ') || [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token Bearer diperlukan.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload !== 'object' || typeof payload.sub !== 'number') {
      return res.status(401).json({ error: 'Token tidak valid.' });
    }
    req.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' });
  }
};

module.exports = requireAuth;
