require('dotenv').config();
const mongoose = require('mongoose');
const { Devotee, User } = require('../models');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bace_management');
  
  // 1. Remove BACE Admin from Devotee database
  const del = await Devotee.deleteMany({
    $or: [
      { email: /terkadamba/i },
      { name: 'ISKCON BACE Admin' },
      { appointment: 'System Administrator' },
      { appointment: 'BACE Administrator' }
    ]
  });
  console.log('Deleted admin devotees from MongoDB:', del.deletedCount);

  // 2. Ensure terkadamba is pure admin user with no devotee record
  const u1 = await User.updateMany(
    { email: /terkadamba/i },
    { $set: { devotee: null, role: 'admin', approvalStatus: 'approved', profileCompleted: true } }
  );
  console.log('Updated terkadamba users:', u1.modifiedCount);

  // 3. Ensure suryakiran is area_leader, not admin
  const u2 = await User.updateMany(
    { email: /suryakiran/i },
    { $set: { role: 'area_leader', approvalStatus: 'approved', profileCompleted: true } }
  );
  console.log('Updated suryakiran users:', u2.modifiedCount);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
