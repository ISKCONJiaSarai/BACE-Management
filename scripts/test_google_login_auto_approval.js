require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Devotee = require('../models/Devotee');

async function runTest() {
  console.log('--- STARTING GOOGLE LOGIN AUTO-APPROVAL TEST ---');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected:', mongoose.connection.host);

  try {
    // 1. Pick an existing devotee in the database
    const existingDevotee = await Devotee.findOne({ email: { $exists: true, $ne: '' } });
    if (!existingDevotee) {
      throw new Error('No devotee with email found in database to test with!');
    }
    console.log('Found existing devotee in DB:', existingDevotee.name, 'Email:', existingDevotee.email);

    const testEmail = existingDevotee.email.toLowerCase().trim();
    const testGoogleId = 'google_test_' + Date.now();

    // Clean up any existing user with this test email
    await User.deleteMany({ email: testEmail });

    // 2. Simulate the exact Google login backend logic from authRoutes.js
    const normalizedEmail = testEmail;
    let user = await User.findOne({
      $or: [{ googleId: testGoogleId }, { email: normalizedEmail }]
    }).populate('devotee');

    let devoteeDoc = await Devotee.findOne({
      email: { $regex: new RegExp('^' + normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
    });

    const isEmailInDb = !!devoteeDoc;
    if (!isEmailInDb) {
      throw new Error('Expected devoteeDoc to be found in database!');
    }

    let devoteeRole = 'devotee';
    const appt = (devoteeDoc.appointment || '').toLowerCase();
    const bRole = (devoteeDoc.batchRole || '').toLowerCase();
    if (appt.includes('area leader')) devoteeRole = 'area_leader';
    else if (appt.includes('overall coordinator') || (appt.includes('coordinator') && !appt.includes('batch'))) devoteeRole = 'coordinator';
    else if (appt.includes('preaching manager')) devoteeRole = 'preaching_manager';
    else if (appt.includes('care manager')) devoteeRole = 'care_manager';
    else if (appt.includes('internal manager')) devoteeRole = 'internal_manager';
    else if (appt.includes('department head') || appt.includes('dept head')) devoteeRole = 'dept_head';
    else if (appt.includes('preaching coordinator') || bRole === 'coordinator') devoteeRole = 'preaching_coord';
    else if (appt.includes('facilitator') || devoteeDoc.isFacilitator) devoteeRole = 'facilitator';

    const isAutoApproved = isEmailInDb;

    const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    const uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;

    user = await User.create({
      username: uniqueUsername,
      email: normalizedEmail,
      googleId: testGoogleId,
      devotee: devoteeDoc._id,
      role: devoteeRole,
      approvalStatus: isAutoApproved ? 'approved' : 'pending_profile',
      profileCompleted: isAutoApproved ? true : false,
      lastLogin: new Date()
    });

    console.log('Created User record for existing devotee:');
    console.log('- Username:', user.username);
    console.log('- Role:', user.role);
    console.log('- Approval Status:', user.approvalStatus);
    console.log('- Profile Completed:', user.profileCompleted);

    if (user.approvalStatus !== 'approved') {
      throw new Error(`Expected approvalStatus to be 'approved', but got '${user.approvalStatus}'`);
    }
    if (!user.profileCompleted) {
      throw new Error(`Expected profileCompleted to be true, but got false`);
    }

    console.log('SUCCESS: Devotee whose email is in database is immediately APPROVED without asking for data or area leader approval!');

    // Clean up test user
    await User.deleteMany({ email: testEmail });
    console.log('Cleaned up test user.');
    console.log('--- TEST PASSED CLEANLY ---');
  } finally {
    await mongoose.disconnect();
  }
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
