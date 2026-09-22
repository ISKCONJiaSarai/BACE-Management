require('dotenv').config();
const mongoose = require('mongoose');
const { Devotee, Attendance } = require('../models');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const dates = await Attendance.distinct('dateStr', { type: 'Morning programme', ref: { $ne: 'mp_raw_log' } });
  console.log('Distinct dateStr in Attendance:', dates);
  const statuses = await Attendance.aggregate([
    { $match: { type: 'Morning programme', ref: { $ne: 'mp_raw_log' } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log('Statuses count in Attendance:', statuses);

  const presentRecords = await Attendance.find({
    type: 'Morning programme',
    status: { $in: ['Present', 'On Time', 'Grace', 'Late', 'Very late'] },
    ref: { $ne: 'mp_raw_log' }
  }).populate('devotee', 'name').limit(10);
  console.log('Sample non-absent attendance records:', presentRecords.map(r => ({
    devotee: r.devotee?.name,
    dateStr: r.dateStr,
    status: r.status,
    timeIn: r.timeIn
  })));

  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
