const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  const authorization = req.get('authorization');
  const [scheme, token, extra] = authorization?.trim().split(/\s+/) || [];

  if (scheme !== 'Bearer' || !token || extra) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_REQUIRED',
      message: 'Token autentikasi Bearer wajib disertakan.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (
      typeof payload !== 'object' ||
      !Number.isSafeInteger(payload.sub) ||
      payload.sub <= 0 ||
      typeof payload.role !== 'string'
    ) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Token autentikasi tidak valid.',
      });
    }

    req.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Token autentikasi tidak valid atau sudah kedaluwarsa.',
    });
  }
};

module.exports = requireAuth;
