const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Devotee = require('../models/Devotee');
const { protect, requireAdminOrAreaLeader, getAdminEmails } = require('../middleware/auth');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @route   GET /api/auth/config
 * @desc    Get public OAuth configuration (Client ID)
 * @access  Public
 */
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

/**
 * @route   POST /api/auth/google
 * @desc    Verify Google ID token and log in / register devotee
 * @access  Public
 */
router.post('/google', async (req, res) => {
  let stage = 'validate_request';
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google ID token
    stage = 'verify_google_token';
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account did not provide an email address'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminEmails = getAdminEmails();

    // 1. Check if user already exists by googleId or email
    stage = 'find_user';
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }]
    }).populate('devotee');

    let devoteeDoc = user ? user.devotee : null;

    // 2. If no user, check if a devotee record already exists with this email
    stage = 'find_devotee';
    if (!devoteeDoc) {
      devoteeDoc = await Devotee.findOne({ email: normalizedEmail });
    }

    const totalUsers = await User.countDocuments();
    const isFirstUser = totalUsers === 0;
    const isEmailAdmin = adminEmails.includes(normalizedEmail);
    const isAdmin = isEmailAdmin || isFirstUser;
    const isBaceAdmin = normalizedEmail === 'terkadamba.js@gmail.com';
    const isSuryaAreaLeader = normalizedEmail === 'suryakiranjune2@gmail.com';

    // 3. If still no devotee record, create a new one
    if (!devoteeDoc) {
      stage = 'create_devotee';
      const customId = `d_g_${Date.now()}`;
      const defaultName = isBaceAdmin ? 'ISKCON BACE Admin' : (isSuryaAreaLeader ? 'Surya Narayana Das' : (name || 'Google Devotee'));
      const defaultAppt = isBaceAdmin ? 'System Administrator' : (isSuryaAreaLeader ? 'Area Leader' : (isAdmin ? 'Area Leader' : 'Devotee'));

      devoteeDoc = await Devotee.create({
        customId,
        name: defaultName,
        email: normalizedEmail,
        status: isAdmin ? 'Active' : 'Pending Approval',
        appointment: defaultAppt,
        joined: new Date(),
        occupation: isBaceAdmin ? 'Administration' : 'Student'
      });
    }

    const determinedRole = isBaceAdmin ? 'admin' : (isSuryaAreaLeader ? 'area_leader' : (isAdmin ? 'area_leader' : 'devotee'));

    // 4. Create or update User record
    if (!user) {
      stage = 'create_user';
      const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      const uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;

      user = await User.create({
        username: uniqueUsername,
        email: normalizedEmail,
        googleId,
        avatar: picture,
        devotee: devoteeDoc._id,
        role: determinedRole,
        approvalStatus: isAdmin ? 'approved' : 'pending_profile',
        profileCompleted: isAdmin ? true : false,
        lastLogin: new Date()
      });
    } else {
      stage = 'update_user';
      user.googleId = googleId;
      if (picture) user.avatar = picture;
      if (!user.devotee && devoteeDoc) user.devotee = devoteeDoc._id;

      if (isBaceAdmin) {
        user.role = 'admin';
        user.approvalStatus = 'approved';
        user.profileCompleted = true;
        if (devoteeDoc) {
          devoteeDoc.name = 'ISKCON BACE Admin';
          devoteeDoc.appointment = 'System Administrator';
          devoteeDoc.status = 'Active';
          await devoteeDoc.save();
        }
      } else if (isSuryaAreaLeader) {
        user.role = 'area_leader';
        user.approvalStatus = 'approved';
        user.profileCompleted = true;
        if (devoteeDoc) {
          devoteeDoc.name = 'Surya Narayana Das';
          devoteeDoc.appointment = 'Area Leader';
          devoteeDoc.status = 'Active';
          await devoteeDoc.save();
        }
      } else if (isAdmin) {
        user.role = 'area_leader';
        user.approvalStatus = 'approved';
        user.profileCompleted = true;
        if (devoteeDoc && devoteeDoc.status !== 'Active') {
          devoteeDoc.status = 'Active';
          await devoteeDoc.save();
        }
      } else if (!user.approvalStatus) {
        user.approvalStatus = user.profileCompleted ? 'pending_approval' : 'pending_profile';
      }

      user.lastLogin = new Date();
      await user.save();
    }

    // 5. Generate application JWT
    stage = 'generate_session_token';
    const jwtSecret = process.env.JWT_SECRET || 'bace_jwt_secret_dev_2026';
    const jwtExpire = process.env.JWT_EXPIRE || '30d';

    const appToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        devoteeId: devoteeDoc ? devoteeDoc._id : null
      },
      jwtSecret,
      { expiresIn: jwtExpire }
    );

    res.json({
      success: true,
      message: 'Authenticated successfully',
      token: appToken,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: devoteeDoc?.name || name || user.username,
        role: user.role,
        avatar: user.avatar || picture || '',
        approvalStatus: user.approvalStatus,
        profileCompleted: !!user.profileCompleted,
        isApproved: user.approvalStatus === 'approved',
        devotee: devoteeDoc?.customId || (devoteeDoc ? devoteeDoc._id.toString() : user._id.toString()),
        devoteeDetails: devoteeDoc
      }
    });
  } catch (error) {
    const requestId = req.requestId || 'unknown';
    const status = ['validate_request', 'verify_google_token'].includes(stage) ? 401 : 500;
    console.error(`[${requestId}] Google auth failed during ${stage}:`, error.stack || error);
    res.status(status).json({
      success: false,
      message: `Google login failed during ${stage}`,
      stage,
      code: error.code || error.name || 'GOOGLE_AUTH_ERROR',
      error: error.message || String(error),
      requestId
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile and approval status
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('devotee');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const devoteeDoc = user.devotee;

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: devoteeDoc?.name || user.username,
        role: user.role,
        avatar: user.avatar || '',
        approvalStatus: user.approvalStatus,
        profileCompleted: !!user.profileCompleted,
        isApproved: user.approvalStatus === 'approved',
        rejectionReason: user.rejectionReason,
        devotee: devoteeDoc?.customId || (devoteeDoc ? devoteeDoc._id.toString() : user._id.toString()),
        devoteeDetails: devoteeDoc
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/auth/complete-profile
 * @desc    Update devotee profile with all database items and mark pending approval
 * @access  Private
 */
router.post('/complete-profile', protect, async (req, res) => {
  try {
    const user = req.user;
    let devoteeDoc = await Devotee.findById(user.devotee);

    if (!devoteeDoc) {
      const customId = `d_${Date.now()}`;
      devoteeDoc = new Devotee({
        customId,
        email: user.email,
        name: req.body.name || user.username,
        status: user.approvalStatus === 'approved' ? 'Active' : 'Pending Approval'
      });
    }

    const {
      name,
      gender,
      dob,
      phone,
      address,
      highestEducation,
      presentStudiesOrJob,
      residence,
      occupation,
      org,
      emergency,
      attendanceMode,
      rounds,
      morningProgram,
      nature,
      interests,
      skills,
      personalSkills,
      availability,
      source
    } = req.body;

    if (name) devoteeDoc.name = name.trim();
    if (gender) devoteeDoc.gender = gender;
    if (dob) devoteeDoc.dob = new Date(dob);
    if (phone) devoteeDoc.phone = phone.trim();
    if (address) devoteeDoc.address = address.trim();
    if (highestEducation) {
      devoteeDoc.highestEducation = highestEducation.trim();
      devoteeDoc.org = highestEducation.trim();
    } else if (org) {
      devoteeDoc.org = org.trim();
      devoteeDoc.highestEducation = org.trim();
    }
    if (presentStudiesOrJob) {
      devoteeDoc.presentStudiesOrJob = presentStudiesOrJob.trim();
      devoteeDoc.occupation = presentStudiesOrJob.trim();
    } else if (occupation) {
      devoteeDoc.occupation = occupation.trim();
      devoteeDoc.presentStudiesOrJob = occupation.trim();
    }
    if (residence) devoteeDoc.residence = residence.trim();
    if (emergency) devoteeDoc.emergency = emergency.trim();
    if (attendanceMode) devoteeDoc.attendanceMode = attendanceMode;

    if (!devoteeDoc.sadhana) devoteeDoc.sadhana = {};
    if (rounds !== undefined) devoteeDoc.sadhana.rounds = Math.max(0, Math.min(64, Number(rounds) || 0));
    if (morningProgram !== undefined) devoteeDoc.sadhana.morningProgram = Math.max(0, Math.min(100, Number(morningProgram) || 0));
    devoteeDoc.sadhana.lastReported = new Date();

    if (!devoteeDoc.swabhav) devoteeDoc.swabhav = {};
    if (nature) devoteeDoc.swabhav.nature = nature;
    if (interests) {
      devoteeDoc.swabhav.interests = Array.isArray(interests)
        ? interests
        : String(interests).split(',').map(s => s.trim()).filter(Boolean);
    }

    const effectiveSkills = personalSkills || skills;
    if (effectiveSkills) {
      devoteeDoc.skills = Array.isArray(effectiveSkills)
        ? effectiveSkills
        : String(effectiveSkills).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (availability) devoteeDoc.availability = availability;
    if (source) devoteeDoc.source = source;

    user.profileCompleted = true;

    // If user is not yet approved, set approval status to pending_approval
    if (user.approvalStatus !== 'approved') {
      user.approvalStatus = 'pending_approval';
      devoteeDoc.status = 'Pending Approval';
    }

    await devoteeDoc.save();
    user.devotee = devoteeDoc._id;
    await user.save();

    res.json({
      success: true,
      message: user.approvalStatus === 'approved'
        ? 'Profile updated successfully'
        : 'Profile submitted successfully and is pending Area Leader approval',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: devoteeDoc.name,
        role: user.role,
        avatar: user.avatar || '',
        approvalStatus: user.approvalStatus,
        profileCompleted: user.profileCompleted,
        isApproved: user.approvalStatus === 'approved',
        devotee: devoteeDoc.customId || devoteeDoc._id.toString(),
        devoteeDetails: devoteeDoc
      }
    });
  } catch (err) {
    console.error('Error completing profile:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/auth/pending-approvals
 * @desc    Get all devotees awaiting Area Leader approval
 * @access  Private (Admin / Area Leader)
 */
router.get('/pending-approvals', protect, requireAdminOrAreaLeader, async (req, res) => {
  try {
    const pendingUsers = await User.find({
      approvalStatus: 'pending_approval'
    }).populate('devotee');

    // Also get devotees with status 'Pending Approval' who may not have a user yet
    const pendingDevotees = await Devotee.find({
      status: 'Pending Approval'
    }).sort({ createdAt: -1 });

    const results = pendingUsers.map(u => ({
      userId: u._id,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
      approvalStatus: u.approvalStatus,
      createdAt: u.createdAt,
      devotee: u.devotee
    }));

    // Add any devotee records with status Pending Approval that aren't already represented
    const userDevoteeIds = new Set(pendingUsers.map(u => u.devotee?._id?.toString()).filter(Boolean));
    for (const d of pendingDevotees) {
      if (!userDevoteeIds.has(d._id.toString())) {
        results.push({
          userId: null,
          username: d.email?.split('@')[0] || d.name,
          email: d.email,
          avatar: '',
          approvalStatus: 'pending_approval',
          createdAt: d.createdAt,
          devotee: d
        });
      }
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/auth/approve-devotee/:id
 * @desc    Approve a pending devotee (by devotee ID or user ID)
 * @access  Private (Admin / Area Leader)
 */
router.post('/approve-devotee/:id', protect, requireAdminOrAreaLeader, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { batch, dept, role } = req.body;

    // Find devotee by _id or customId
    let devotee = await Devotee.findOne({
      $or: [
        { _id: targetId.match(/^[0-9a-fA-F]{24}$/) ? targetId : null },
        { customId: targetId }
      ].filter(x => Object.values(x)[0] !== null)
    });

    let user = await User.findOne({
      $or: [
        { _id: targetId.match(/^[0-9a-fA-F]{24}$/) ? targetId : null },
        { devotee: devotee?._id }
      ].filter(x => Object.values(x)[0] !== null)
    });

    if (!devotee && user?.devotee) {
      devotee = await Devotee.findById(user.devotee);
    }

    if (!devotee && !user) {
      return res.status(404).json({ success: false, message: 'Devotee / User not found' });
    }

    if (devotee) {
      devotee.status = 'Active';
      if (batch) devotee.batch = batch;
      if (dept) devotee.dept = dept;
      await devotee.save();
    }

    if (user) {
      user.approvalStatus = 'approved';
      user.profileCompleted = true;
      user.approvedBy = req.user._id;
      user.approvedAt = new Date();
      if (role) user.role = role;
      await user.save();
    }

    res.json({
      success: true,
      message: `Devotee ${devotee?.name || user?.username} has been approved successfully!`,
      devotee,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/auth/reject-devotee/:id
 * @desc    Reject a pending devotee registration
 * @access  Private (Admin / Area Leader)
 */
router.post('/reject-devotee/:id', protect, requireAdminOrAreaLeader, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { reason } = req.body;

    let devotee = await Devotee.findOne({
      $or: [
        { _id: targetId.match(/^[0-9a-fA-F]{24}$/) ? targetId : null },
        { customId: targetId }
      ].filter(x => Object.values(x)[0] !== null)
    });

    let user = await User.findOne({
      $or: [
        { _id: targetId.match(/^[0-9a-fA-F]{24}$/) ? targetId : null },
        { devotee: devotee?._id }
      ].filter(x => Object.values(x)[0] !== null)
    });

    if (devotee) {
      devotee.status = 'Inactive';
      await devotee.save();
    }

    if (user) {
      user.approvalStatus = 'rejected';
      user.rejectionReason = reason || 'Registration declined by Area Leader';
      await user.save();
    }

    res.json({
      success: true,
      message: `Registration for ${devotee?.name || user?.username} has been rejected.`,
      devotee,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
