const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');
const loadAppConfig = require('../config/env');
const { Devotee, Batch, User } = require('../models');

dotenv.config();
loadAppConfig();

async function runRoleTest() {
  console.log('--- STARTING ROLE PERMISSION TEST ---');
  await connectDB();

  // Create a regular devotee user
  let regularUser = await User.findOne({ role: 'devotee' });
  if (!regularUser) {
    regularUser = await User.create({
      username: 'test_regular_devotee_' + Date.now(),
      email: 'test_regular@example.com',
      role: 'devotee',
      active: true,
      approvalStatus: 'approved',
      profileCompleted: true
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'bace_jwt_secret_dev_2026';
  const regularToken = jwt.sign({ id: regularUser._id }, jwtSecret, { expiresIn: '1d' });

  const app = require('../server');
  const http = require('http');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const testUrl = `http://localhost:${port}/api/devotees/import-csv`;

  // Test with regular devotee user token -> expect 403 Forbidden
  const resForbidden = await fetch(testUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${regularToken}`
    },
    body: JSON.stringify({
      devotees: [{ name: 'Unauthorized Attempt' }]
    })
  });

  console.log('Regular Devotee status code:', resForbidden.status);
  if (resForbidden.status === 403) {
    console.log('SUCCESS: Regular devotee properly blocked with 403 Forbidden!');
  } else {
    console.error('FAILURE: Regular devotee was not blocked! Status:', resForbidden.status);
    server.close();
    process.exit(1);
  }

  server.close();
  console.log('--- ROLE TEST PASSED ---');
  process.exit(0);
}

runRoleTest().catch((err) => {
  console.error('Role test error:', err);
  process.exit(1);
});
