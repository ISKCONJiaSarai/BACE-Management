const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config();

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:5000${path}`, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function verify() {
  console.log('=== 1. Testing API Endpoints ===');

  // Test GET /api/devotees
  const devRes = await makeRequest('/api/devotees');
  console.log('GET /api/devotees status:', devRes.status);
  const devotees = devRes.data?.data || [];
  const adminDev = devotees.find(d => 
    (d.email && d.email.includes('terkadamba')) ||
    d.appointment === 'BACE Administrator' ||
    d.appointment === 'System Administrator' ||
    d.name === 'ISKCON BACE Admin'
  );
  if (adminDev) {
    console.error('FAIL: Found admin in GET /api/devotees:', adminDev);
    process.exit(1);
  } else {
    console.log('PASS: BACE Administrator is NOT in GET /api/devotees (total devotees:', devotees.length, ')');
  }

  // Test POST /api/devotees with role admin
  const createAdminRes = await makeRequest('/api/devotees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Fake Admin Devotee',
      email: 'fakeadmin@example.com',
      role: 'admin'
    }
  });
  console.log('POST /api/devotees with role admin status:', createAdminRes.status);
  if (createAdminRes.status === 400) {
    console.log('PASS: Correctly rejected creating devotee with admin role');
  } else {
    console.error('FAIL: Did not reject admin devotee creation, status:', createAdminRes.status);
    process.exit(1);
  }

  console.log('\n=== 2. Testing MongoDB Database State ===');
  await mongoose.connect(process.env.MONGODB_URI);
  const { User, Devotee } = require('../models');

  const terkDevotees = await Devotee.find({ email: /terkadamba/i });
  console.log('Devotee records with terkadamba email:', terkDevotees.length);
  if (terkDevotees.length === 0) {
    console.log('PASS: 0 devotee records in database for BACE admin');
  } else {
    console.error('FAIL: Found devotee record in DB for BACE admin:', terkDevotees);
    process.exit(1);
  }

  const terkUsers = await User.find({ email: /terkadamba/i });
  console.log('User records for terkadamba:');
  for (const u of terkUsers) {
    console.log(` - ${u.email}: role=${u.role}, devotee=${u.devotee}`);
    if (u.role !== 'admin' || u.devotee !== null) {
      console.error('FAIL: terkadamba user does not have pure admin role or has devotee set');
      process.exit(1);
    }
  }
  console.log('PASS: terkadamba users have role=admin and devotee=null');

  const suryaUsers = await User.find({ email: /suryakiran/i });
  console.log('User records for suryakiran:');
  for (const u of suryaUsers) {
    console.log(` - ${u.email}: role=${u.role}, devotee=${u.devotee}`);
    if (u.role !== 'area_leader') {
      console.error('FAIL: suryakiran user role is not area_leader');
      process.exit(1);
    }
  }
  console.log('PASS: suryakiran user has role=area_leader');

  await mongoose.disconnect();
  console.log('\nALL BACKEND & DB CHECKS PASSED SUCCESSFULLY!');
}

verify().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
