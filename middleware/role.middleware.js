exports.authorizeSecurityOrAdmin = (req, res, next) => {
  const role = req.headers['x-role'];
  if (role === 'admin' || role === 'security') return next();
  return res.status(403).json({ message: 'Access denied' });
};
