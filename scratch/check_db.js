require('dotenv').config();
const mongoose = require('mongoose');
const { Devotee, Attendance } = require('../models');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to DB');
  const count = await Devotee.countDocuments();
  console.log('Total devotees in DB:', count);
  const rawLog = await Attendance.findOne({ type: 'Morning programme', ref: 'mp_raw_log' });
  console.log('rawLog found:', !!rawLog, 'notes length:', rawLog?.notes?.length);
  if (rawLog && rawLog.notes) {
    console.log('First 200 chars of notes:\n', rawLog.notes.substring(0, 200));
  }
  const attCount = await Attendance.countDocuments({ type: 'Morning programme' });
  console.log('Morning attendance records count:', attCount);
  const sampleAtt = await Attendance.find({ type: 'Morning programme', ref: { $ne: 'mp_raw_log' } }).limit(5);
  console.log('Sample morning records:', sampleAtt);
  process.exit(0);
}
test().catch(err => { console.error(err); process.exit(1); });
