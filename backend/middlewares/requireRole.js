const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_REQUIRED',
      message: 'Autentikasi diperlukan untuk mengakses fitur ini.',
    });
  }
  if (!allowedRoles.includes(req.auth.role)) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Anda tidak memiliki izin untuk mengakses fitur ini.',
    });
  }
  return next();
};

module.exports = requireRole;
