/**
 * clear_batch_devotees.js
 * 
 * Deletes all devotee records from MongoDB EXCEPT:
 *  - BACE Administrator (terkadambajs@gmail.com / appointment === 'BACE Administrator')
 *  - Area Leader (suryakiranjune2@gmail.com)
 * 
 * Run with: node scripts/clear_batch_devotees.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
// Register all models first (required before populate() calls)
require('../models/Batch');
require('../models/Department');
require('../models/CareGroup');
const Devotee = require('../models/Devotee');


// Emails to ALWAYS keep (never delete these)
const PROTECTED_EMAILS = [
  'terkadambajs@gmail.com',
  'terkadamba.js@gmail.com',
  'suryakiranjune2@gmail.com',
  'surya.kiran.june2@gmail.com'
];

async function main() {
  console.log('\n🔗 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas\n');

  // Count before
  const totalBefore = await Devotee.countDocuments();
  console.log(`📊 Total devotees in database: ${totalBefore}`);

  // Find protected devotees (admin + area leader)
  const protectedDevotees = await Devotee.find({
    $or: [
      { email: { $in: PROTECTED_EMAILS } },
      { appointment: 'BACE Administrator' }
    ]
  }, { name: 1, email: 1, appointment: 1 });

  console.log(`\n🛡️  Protected accounts (will NOT be deleted):`);
  protectedDevotees.forEach(d => {
    console.log(`   • ${d.name} (${d.email || 'no email'}) — ${d.appointment || 'Area Leader'}`);
  });

  const protectedIds = protectedDevotees.map(d => d._id);

  // Count how many will be deleted
  const toDeleteCount = await Devotee.countDocuments({
    _id: { $nin: protectedIds }
  });

  console.log(`\n🗑️  Devotees to be deleted: ${toDeleteCount}`);
  
  if (toDeleteCount === 0) {
    console.log('✅ Nothing to delete. Exiting.');
    await mongoose.disconnect();
    return;
  }

  // Show a sample of what will be deleted
  const sample = await Devotee.find(
    { _id: { $nin: protectedIds } },
    { name: 1, email: 1, batch: 1 }
  ).limit(10).populate('batch', 'name');

  console.log('\n📋 Sample of devotees that will be deleted (first 10):');
  sample.forEach(d => {
    const batchName = d.batch ? (d.batch.name || d.batch) : 'Unassigned';
    console.log(`   • ${d.name} — Batch: ${batchName}`);
  });

  if (toDeleteCount > 10) {
    console.log(`   ... and ${toDeleteCount - 10} more`);
  }

  // Perform deletion
  console.log('\n⚡ Deleting batch member devotees...');
  const result = await Devotee.deleteMany({
    _id: { $nin: protectedIds }
  });

  console.log(`\n✅ Deleted ${result.deletedCount} devotee records.`);

  // Verify final state
  const remaining = await Devotee.find({}, { name: 1, email: 1, appointment: 1 });
  console.log(`\n📊 Remaining devotees in database: ${remaining.length}`);
  remaining.forEach(d => {
    console.log(`   • ${d.name} (${d.email || 'no email'})`);
  });

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB. Done!\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
