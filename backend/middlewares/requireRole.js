const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.auth || !allowedRoles.includes(req.auth.role)) {
    return res.status(403).json({ error: 'Anda tidak memiliki izin untuk mengakses fitur ini.' });
  }
  return next();
};

module.exports = requireRole;
