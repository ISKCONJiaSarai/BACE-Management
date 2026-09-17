const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Devotee, Attendance } = require('../models');

// Helper to escape regex special characters
const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Normalize devotee names for biometric first-name matching
function matchDevoteeFirstName(bioName, dbName) {
  if (!bioName || !dbName) return false;
  const clean = s => String(s || '').toLowerCase()
    .replace(/\b(pr|prabhu|das|dasa|ji|brahmachari)\b/gi, '')
    .replace(/[^a-z0-9\s]/gi, '')
    .trim();
  const getFirst = s => clean(s).split(/\s+/).filter(Boolean)[0] || '';
  
  const f1 = getFirst(bioName);
  const f2 = getFirst(dbName);
  if (!f1 || !f2) return false;
  if (f1 === f2) return true;
  
  const norm = s => s
    .replace(/ee/g, 'e')
    .replace(/i/g, 'e')
    .replace(/y/g, 'i')
    .replace(/w/g, 'v')
    .replace(/sh/g, 's')
    .replace(/dh/g, 'd')
    .replace(/bh/g, 'b')
    .replace(/(.)\1+/g, '$1')
    .replace(/a+$/g, '');
  
  const n1 = norm(f1);
  const n2 = norm(f2);
  if (n1 === n2) return true;
  if ((n1.length >= 4 && n2.startsWith(n1)) || (n2.length >= 4 && n1.startsWith(n2))) return true;
  
  const n1NoV = n1.replace(/[aeiou]/g, '');
  const n2NoV = n2.replace(/[aeiou]/g, '');
  if (n1NoV && n1NoV === n2NoV && n1NoV.length >= 3) return true;
  
  return false;
}

// @route   GET /api/attendance/morning
// @desc    Retrieve persistent morning programme attendance sessions, raw text, and devotee stats
router.get('/morning', async (req, res) => {
  try {
    const rawRecord = await Attendance.findOne({ type: 'Morning programme', ref: 'mp_raw_log' });
    const allDbDevs = await Devotee.find({
      appointment: { $nin: ['BACE Administrator', 'System Administrator'] },
      name: { $ne: 'ISKCON BACE Admin' }
    }).select('name customId morningStandardTime morningAttendance sadhana appointment dept batch');

    if (!rawRecord || !rawRecord.notes) {
      return res.json({
        success: true,
        hasData: false,
        rawBiometricText: null,
        devotees: allDbDevs
      });
    }

    res.json({
      success: true,
      hasData: true,
      rawBiometricText: rawRecord.notes,
      updatedAt: rawRecord.updatedAt,
      devotees: allDbDevs
    });
  } catch (err) {
    console.error('Error fetching morning attendance:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Merge previous biometric notes with incoming text so past sessions are never lost
function mergeBiometricLines(existingNotes, newText) {
  if (!existingNotes || !existingNotes.trim()) return newText || '';
  if (!newText || !newText.trim()) return existingNotes || '';

  const clean = t => String(t).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  const existingLines = clean(existingNotes);
  const newLines = clean(newText);
  if (!existingLines.length) return newText;
  if (!newLines.length) return existingNotes;

  const set = new Set(existingLines);
  newLines.forEach(l => {
    const low = l.toLowerCase();
    if ((low.includes('datetime') || low.includes('punchtime')) && (low.includes('name') || low.includes('enno'))) return;
    set.add(l);
  });
  return Array.from(set).join('\n');
}

// @route   POST /api/attendance/morning-sync
// @desc    Save uploaded biometric text and sync all check-in records into individual devotees in MongoDB
router.post('/morning-sync', async (req, res) => {
  try {
    const { rawBiometricText, byDateRows, availableDates } = req.body;
    if (!rawBiometricText) {
      return res.status(400).json({ success: false, message: 'rawBiometricText is required' });
    }

    // 1. Fetch all registered devotees from MongoDB
    const allDevs = await Devotee.find({
      appointment: { $nin: ['BACE Administrator', 'System Administrator'] },
      name: { $ne: 'ISKCON BACE Admin' }
    });

    const devMap = new Map();
    allDevs.forEach(d => {
      devMap.set(String(d._id), d);
      if (d.customId) devMap.set(String(d.customId), d);
      if (d.name) devMap.set(d.name.trim().toLowerCase(), d);
    });

    // 2. Persist the raw biometric log into Attendance collection so reload is instant and records accumulate
    let rawLogDoc = await Attendance.findOne({ type: 'Morning programme', ref: 'mp_raw_log' });
    let adminDev = allDevs.find(d => (d.email || '').includes('terkadamba') || d.appointment === 'Area Leader') || allDevs[0];
    if (!adminDev) {
      try { adminDev = await Devotee.findOne(); } catch(e){}
    }
    const mergedNotes = rawLogDoc ? mergeBiometricLines(rawLogDoc.notes, rawBiometricText) : rawBiometricText;
    if (rawLogDoc) {
      rawLogDoc.notes = mergedNotes;
      rawLogDoc.date = new Date();
      await rawLogDoc.save();
    } else {
      rawLogDoc = await Attendance.create({
        devotee: adminDev ? adminDev._id : undefined,
        type: 'Morning programme',
        ref: 'mp_raw_log',
        notes: mergedNotes,
        status: 'Present',
        date: new Date()
      });
    }

    // 3. Upsert individual date attendance records and update each devotee's MongoDB profile
    let totalRecordsSynced = 0;
    const dates = Array.isArray(availableDates) && availableDates.length ? availableDates : Object.keys(byDateRows || {});

    // Collect devotee aggregated metrics
    const devoteeStatsMap = new Map();
    allDevs.forEach(d => {
      devoteeStatsMap.set(d._id.toString(), {
        devotee: d,
        totalSessions: dates.length,
        presentCount: 0,
        onTimeCount: 0,
        graceCount: 0,
        lateCount: 0,
        absentCount: 0,
        lastPunchDate: '',
        lastTimeIn: '',
        lastStatus: ''
      });
    });

    const attendanceOps = [];

    dates.forEach(dt => {
      const rows = (byDateRows && byDateRows[dt]) || [];
      rows.forEach(r => {
        // Match devotee in MongoDB by id or first name
        let matchedDev = (r.devoteeId && devMap.get(String(r.devoteeId))) || null;
        if (!matchedDev && r.name) {
          matchedDev = devMap.get(r.name.trim().toLowerCase());
        }
        if (!matchedDev) {
          matchedDev = allDevs.find(d => matchDevoteeFirstName(r.name, d.name));
        }
        if (!matchedDev) return;

        const devIdStr = matchedDev._id.toString();
        const stat = devoteeStatsMap.get(devIdStr);
        if (stat) {
          if (r.status !== 'Absent') {
            stat.presentCount++;
            if (r.status === 'On Time') stat.onTimeCount++;
            else if (r.status === 'Grace') stat.graceCount++;
            else if (r.status === 'Late') stat.lateCount++;
            stat.lastPunchDate = dt;
            stat.lastTimeIn = r.timeIn;
            stat.lastStatus = r.status;
          } else {
            stat.absentCount++;
          }
        }

        const dateObj = new Date(dt);
        const refStr = 'mp_' + dt;
        attendanceOps.push({
          updateOne: {
            filter: { devotee: matchedDev._id, type: 'Morning programme', dateStr: dt },
            update: {
              $set: {
                devotee: matchedDev._id,
                type: 'Morning programme',
                date: isNaN(dateObj.getTime()) ? new Date() : dateObj,
                dateStr: dt,
                ref: refStr,
                status: r.status === 'On Time' || r.status === 'Grace' ? 'Present' : (r.status === 'Late' ? 'Late' : 'Absent'),
                timeIn: r.timeIn || '—',
                timeInMin: r.timeInMin ?? null,
                standardTime: r.standardTime || '04:30 AM',
                diffMin: r.diffMin ?? null,
                notes: r.badgeText || ''
              }
            },
            upsert: true
          }
        });
        totalRecordsSynced++;
      });
    });

    for (let i = 0; i < attendanceOps.length; i += 500) {
      const chunk = attendanceOps.slice(i, i + 500);
      await Attendance.bulkWrite(chunk, { ordered: false });
    }

    // 4. Update each individual devotee document in MongoDB with persistent morning attendance & sadhana
    const devoteeUpdatePromises = [];
    for (const [devIdStr, stat] of devoteeStatsMap.entries()) {
      const dev = stat.devotee;
      const totalS = stat.totalSessions || 1;
      const attRate = Math.round((stat.presentCount / totalS) * 100);
      const punctRate = stat.presentCount > 0 ? Math.round(((stat.onTimeCount + stat.graceCount) / stat.presentCount) * 100) : 0;

      dev.morningAttendance = {
        totalSessions: totalS,
        presentCount: stat.presentCount,
        onTimeCount: stat.onTimeCount,
        graceCount: stat.graceCount,
        lateCount: stat.lateCount,
        absentCount: stat.absentCount,
        attendanceRate: attRate,
        punctualityRate: punctRate,
        lastPunchDate: stat.lastPunchDate,
        lastTimeIn: stat.lastTimeIn,
        lastStatus: stat.lastStatus
      };

      if (!dev.sadhana) dev.sadhana = {};
      dev.sadhana.morningProgram = attRate;
      dev.sadhana.lastReported = new Date();

      devoteeUpdatePromises.push(dev.save());
    }

    await Promise.all(devoteeUpdatePromises);

    res.json({
      success: true,
      message: `Successfully stored morning attendance in MongoDB across ${dates.length} sessions and updated ${devoteeStatsMap.size} devotees!`,
      totalSessions: dates.length,
      totalDevoteesUpdated: devoteeStatsMap.size
    });
  } catch (err) {
    console.error('Error syncing morning attendance to MongoDB:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/attendance/morning-clear
// @desc    Clear stored morning attendance records from MongoDB
router.post('/morning-clear', async (req, res) => {
  try {
    await Attendance.deleteMany({ type: 'Morning programme' });
    await Devotee.updateMany({}, {
      $set: {
        'morningAttendance.totalSessions': 0,
        'morningAttendance.presentCount': 0,
        'morningAttendance.onTimeCount': 0,
        'morningAttendance.graceCount': 0,
        'morningAttendance.lateCount': 0,
        'morningAttendance.absentCount': 0,
        'morningAttendance.attendanceRate': 0,
        'morningAttendance.punctualityRate': 0,
        'sadhana.morningProgram': 0
      }
    });

    res.json({
      success: true,
      message: 'Cleared all morning attendance records from MongoDB.'
    });
  } catch (err) {
    console.error('Error clearing morning attendance:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
