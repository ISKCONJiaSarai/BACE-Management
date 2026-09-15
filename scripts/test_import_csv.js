const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');
const loadAppConfig = require('../config/env');
const { Devotee, Batch, User } = require('../models');

dotenv.config();
loadAppConfig();

async function runTest() {
  console.log('--- STARTING CSV IMPORT TEST ---');
  await connectDB();

  // 1. Find or create an admin user for testing
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.findOne({ email: 'terkadambajs@gmail.com' });
  }
  if (!adminUser) {
    adminUser = await User.create({
      username: 'test_admin_dev',
      email: 'terkadambajs@gmail.com',
      role: 'admin',
      active: true,
      approvalStatus: 'approved',
      profileCompleted: true
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'bace_jwt_secret_dev_2026';
  const token = jwt.sign({ id: adminUser._id }, jwtSecret, { expiresIn: '1d' });

  // 2. Fetch an existing devotee to test update
  const existingDev = await Devotee.findOne({ name: { $regex: /Purushottam/i } });
  if (!existingDev) {
    console.error('Could not find existing devotee Purushottam');
    process.exit(1);
  }
  const originalPhone = existingDev.phone;
  const testPhone = '9998887776';
  const newDevoteeName = 'Test Bhakta Gauranga_' + Date.now();

  console.log(`Found existing devotee: ${existingDev.name}, current phone: ${originalPhone}`);

  // 3. Test the route handler logic or make HTTP request to the running server
  // Let's test with node-fetch or native fetch (Node 18+)
  const serverUrl = 'http://localhost:5000/api/devotees/import-csv';

  // Import mock app
  const app = require('../server');
  const http = require('http');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const testUrl = `http://localhost:${port}/api/devotees/import-csv`;

  console.log(`Test server running on port ${port}`);

  const payload = {
    devotees: [
      {
        name: existingDev.name.toUpperCase(), // Test case-insensitivity
        phone: testPhone,
        residence: 'Updated Nilachal Dham BACE',
        status: 'Active'
      },
      {
        name: newDevoteeName,
        phone: '9123456789',
        batch: 'Gaurvani Sabha',
        residence: 'Jia Sarai BACE',
        status: 'New',
        level: 3
      }
    ]
  };

  const response = await fetch(testUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  console.log('Import Response Status:', response.status);
  console.log('Import Response Data:', json);

  if (!response.ok || !json.success) {
    console.error('Test FAILED: Response was not successful');
    server.close();
    process.exit(1);
  }

  // 4. Verify MongoDB assertions
  // Verify existing devotee was updated and NOT duplicated
  const matches = await Devotee.find({ name: { $regex: new RegExp(`^${existingDev.name}$`, 'i') } });
  console.log(`Matches count for ${existingDev.name}: ${matches.length} (Expected: 1)`);
  if (matches.length !== 1) {
    console.error(`FAILURE: Expected exactly 1 match for ${existingDev.name}, found ${matches.length}`);
    server.close();
    process.exit(1);
  }
  if (matches[0].phone !== testPhone) {
    console.error(`FAILURE: Phone not updated. Expected ${testPhone}, got ${matches[0].phone}`);
    server.close();
    process.exit(1);
  }
  console.log('SUCCESS: Existing devotee correctly updated without duplication!');

  // Verify new devotee was added
  const newMatches = await Devotee.find({ name: newDevoteeName });
  console.log(`Matches count for ${newDevoteeName}: ${newMatches.length} (Expected: 1)`);
  if (newMatches.length !== 1) {
    console.error(`FAILURE: Expected new devotee ${newDevoteeName} to be created, found ${newMatches.length}`);
    server.close();
    process.exit(1);
  }
  console.log('SUCCESS: New devotee correctly created!');

  // Clean up test data
  await Devotee.deleteOne({ name: newDevoteeName });
  // Restore original phone
  matches[0].phone = originalPhone;
  await matches[0].save();
  console.log('Cleaned up test devotee and restored original devotee phone.');

  server.close();
  console.log('--- TEST PASSED CLEANLY ---');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
