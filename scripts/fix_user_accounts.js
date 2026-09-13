require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../models/User');
    const Devotee = require('../models/Devotee');

    console.log('Connected to MongoDB');

    // 1. suryakiranjune2@gmail.com -> Surya Narayana Das, Area Leader
    let suryaUser = await User.findOne({ email: 'suryakiranjune2@gmail.com' }).populate('devotee');
    let suryaDevotee = await Devotee.findOne({ email: 'suryakiranjune2@gmail.com' });

    if (!suryaDevotee) {
      suryaDevotee = await Devotee.create({
        customId: 'd_surya_' + Date.now(),
        name: 'Surya Narayana Das',
        email: 'suryakiranjune2@gmail.com',
        gender: 'M',
        phone: '7907737187',
        address: 'Jia Sarai BACE',
        org: 'IIT Delhi',
        occupation: 'Full-time devotee / PhD scholar',
        status: 'Active',
        level: 3,
        appointment: 'Area Leader',
        joined: new Date('2022-01-01')
      });
    } else {
      suryaDevotee.name = 'Surya Narayana Das';
      suryaDevotee.appointment = 'Area Leader';
      suryaDevotee.status = 'Active';
      suryaDevotee.level = 3;
      await suryaDevotee.save();
    }

    if (!suryaUser) {
      suryaUser = await User.create({
        email: 'suryakiranjune2@gmail.com',
        username: 'suryanarayanadas',
        devotee: suryaDevotee._id,
        role: 'area_leader',
        approvalStatus: 'approved',
        profileCompleted: true,
        active: true
      });
    } else {
      suryaUser.role = 'area_leader';
      suryaUser.approvalStatus = 'approved';
      suryaUser.profileCompleted = true;
      suryaUser.devotee = suryaDevotee._id;
      await suryaUser.save();
    }
    console.log('Surya User updated:', suryaUser.email, '->', suryaDevotee.name, suryaUser.role);

    // 2. terkadamba.js@gmail.com -> ISKCON BACE admin id
    let adminUser = await User.findOne({ email: 'terkadamba.js@gmail.com' }).populate('devotee');
    let adminDevotee = await Devotee.findOne({ email: 'terkadamba.js@gmail.com' });

    if (!adminDevotee) {
      adminDevotee = await Devotee.create({
        customId: 'd_admin_' + Date.now(),
        name: 'ISKCON BACE Admin',
        email: 'terkadamba.js@gmail.com',
        gender: 'M',
        phone: '7907737187',
        address: 'Jia Sarai BACE',
        org: 'ISKCON BACE',
        occupation: 'Administration',
        status: 'Active',
        level: 3,
        appointment: 'System Administrator',
        joined: new Date('2021-01-01')
      });
    } else {
      adminDevotee.name = 'ISKCON BACE Admin';
      adminDevotee.appointment = 'System Administrator';
      adminDevotee.status = 'Active';
      await adminDevotee.save();
    }

    if (!adminUser) {
      adminUser = await User.create({
        email: 'terkadamba.js@gmail.com',
        username: 'terkadambajs',
        devotee: adminDevotee._id,
        role: 'admin',
        approvalStatus: 'approved',
        profileCompleted: true,
        active: true
      });
    } else {
      adminUser.role = 'admin';
      adminUser.approvalStatus = 'approved';
      adminUser.profileCompleted = true;
      adminUser.devotee = adminDevotee._id;
      await adminUser.save();
    }
    console.log('Admin User updated:', adminUser.email, '->', adminDevotee.name, adminUser.role);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
