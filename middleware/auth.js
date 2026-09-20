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

const isBaceAdminEmail = (email) => {
  if (!email) return false;
  const clean = String(email).toLowerCase().trim();
  const [local, domain] = clean.split('@');
  if (domain === 'gmail.com') return local.replace(/\./g, '') === 'terkadambajs';
  return clean === 'terkadambajs@gmail.com' || clean === 'terkadamba.js@gmail.com';
};

const isSuryaEmail = (email) => {
  if (!email) return false;
  const clean = String(email).toLowerCase().trim();
  const [local, domain] = clean.split('@');
  if (domain === 'gmail.com') return local.replace(/\./g, '') === 'suryakiranjune2';
  return clean === 'suryakiranjune2@gmail.com';
};

const isCounsellorEmail = (email) => {
  if (!email) return false;
  const clean = String(email).toLowerCase().trim();
  const [local] = clean.split('@');
  const loc = (local || '').replace(/\./g, '');
  if (loc === 'anurag0krishna' || clean.startsWith('anurag0krishna@gmail')) return true;
  if (loc === 'shubhamshukla6606' || clean.startsWith('shubham.shukla6606@gmail')) return true;
  return false;
};

const requireAdminOrAreaLeader = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const adminEmails = getAdminEmails();
  const userEmail = req.user.email?.toLowerCase?.() || '';
  const isAdmin = adminEmails.includes(userEmail) || req.user.role === 'admin' || isBaceAdminEmail(userEmail);
  const isAreaLeader = req.user.role === 'area_leader' || isSuryaEmail(userEmail);
  const isCounsellor = req.user.role === 'counsellor' || isCounsellorEmail(userEmail);

  if (isAdmin || isAreaLeader || isCounsellor) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Requires Admin, Counsellor, or Area Leader privileges'
  });
};

const requireDevoteeImportPermission = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const adminEmails = getAdminEmails();
  const userEmail = req.user.email?.toLowerCase?.() || '';
  const isAdmin = adminEmails.includes(userEmail) || req.user.role === 'admin' || isBaceAdminEmail(userEmail);
  const isAreaLeader = req.user.role === 'area_leader' || isSuryaEmail(userEmail);
  const isCounsellor = req.user.role === 'counsellor' || isCounsellorEmail(userEmail);

  if (isAdmin || isAreaLeader || isCounsellor) {
    req.importScope = { all: true, coordinatedBatchIds: [] };
    return next();
  }

  // Check Batch Coordinator permissions
  const Batch = require('../models/Batch');
  const coordinatedBatchIds = new Set();

  const dev = req.devotee;
  if (dev && dev.batch && (dev.batchRole === 'Coordinator' || dev.appointment === 'Coordinator' || req.user.role === 'preaching_coord')) {
    coordinatedBatchIds.add(String(dev.batch));
  }

  if (dev && dev._id) {
    const batches = await Batch.find({ coordinator: dev._id });
    batches.forEach(b => {
      coordinatedBatchIds.add(String(b._id));
      if (b.customId) coordinatedBatchIds.add(String(b.customId));
    });
  }

  if (req.user.role === 'preaching_coord' || req.user.role === 'coordinator' || coordinatedBatchIds.size > 0) {
    req.importScope = {
      all: false,
      isBatchCoordinator: true,
      coordinatedBatchIds: Array.from(coordinatedBatchIds)
    };
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: CSV import is only permitted for Batch Coordinators, Area Leaders, and Administrators'
  });
};

module.exports = {
  protect,
  requireAdminOrAreaLeader,
  requireDevoteeImportPermission,
  getAdminEmails,
  isBaceAdminEmail,
  isSuryaEmail,
  isCounsellorEmail
};

