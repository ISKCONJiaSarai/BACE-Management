const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Devotee = require('../models/Devotee');

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
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google ID token
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

    // 1. Check if user already exists by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }]
    }).populate('devotee');

    let devoteeDoc = user ? user.devotee : null;

    // 2. If no user, check if a devotee record already exists with this email
    if (!devoteeDoc) {
      devoteeDoc = await Devotee.findOne({ email: normalizedEmail });
    }

    // 3. If still no devotee record, create a new one
    if (!devoteeDoc) {
      // Find a safe customId if needed
      const count = await Devotee.countDocuments();
      const customId = `d_g_${Date.now()}`;

      devoteeDoc = await Devotee.create({
        customId,
        name: name || 'Google Devotee',
        email: normalizedEmail,
        status: 'New',
        joined: new Date(),
        occupation: 'Student'
      });
    }

    // 4. Create or update User record
    if (!user) {
      const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      const uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;

      // Default role: admin if matches temple coordinator email or if first user, else admin/devotee
      const totalUsers = await User.countDocuments();
      const role = totalUsers === 0 ? 'admin' : 'devotee';

      user = await User.create({
        username: uniqueUsername,
        email: normalizedEmail,
        googleId,
        avatar: picture,
        devotee: devoteeDoc._id,
        role: role,
        lastLogin: new Date()
      });
    } else {
      user.googleId = googleId;
      if (picture) user.avatar = picture;
      if (!user.devotee && devoteeDoc) user.devotee = devoteeDoc._id;
      user.lastLogin = new Date();
      await user.save();
    }

    // 5. Generate application JWT
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
        devotee: devoteeDoc?.customId || (devoteeDoc ? devoteeDoc._id.toString() : user._id.toString()),
        devoteeDetails: devoteeDoc
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid Google authentication token',
      error: error.message
    });
  }
});

module.exports = router;
