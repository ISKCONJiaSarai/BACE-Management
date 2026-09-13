const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.toLowerCase().trim())
    .filter(Boolean);
}

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token missing'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'bace_jwt_secret_dev_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).populate('devotee');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists'
      });
    }

    req.user = user;
    req.devotee = user.devotee;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: err.message
    });
  }
};

const requireAdminOrAreaLeader = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes(req.user.email?.toLowerCase?.() || '');
  const hasAdminRole = ['admin', 'area_leader'].includes(req.user.role);

  if (isAdmin || hasAdminRole) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Requires Admin or Area Leader privileges'
  });
};

module.exports = {
  protect,
  requireAdminOrAreaLeader,
  getAdminEmails
};
