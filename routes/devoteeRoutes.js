const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Devotee, User, Batch, Department, CareGroup } = require('../models');
const { protect, requireDevoteeImportPermission } = require('../middleware/auth');

const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function resolveDevoteeRelations(data) {
  const clean = { ...data };

  // Resolve Batch
  if (clean.batch) {
    const rawBatch = String(clean.batch).trim();
    if (mongoose.Types.ObjectId.isValid(rawBatch)) {
      clean.batch = rawBatch;
    } else if (rawBatch && rawBatch !== 'none') {
      const bDoc = await Batch.findOne({
        $or: [
          { customId: rawBatch },
          { name: new RegExp('^' + escapeRegex(rawBatch) + '$', 'i') }
        ]
      });
      clean.batch = bDoc ? bDoc._id : null;
    } else {
      clean.batch = null;
    }
  } else {
    clean.batch = null;
  }

  // Resolve Department
  if (clean.dept) {
    const rawDept = String(clean.dept).trim();
    if (mongoose.Types.ObjectId.isValid(rawDept)) {
      clean.dept = rawDept;
    } else if (rawDept && rawDept !== 'none') {
      const dDoc = await Department.findOne({
        $or: [
          { customId: rawDept },
          { name: new RegExp('^' + escapeRegex(rawDept) + '$', 'i') }
        ]
      });
      clean.dept = dDoc ? dDoc._id : null;
    } else {
      clean.dept = null;
    }
  } else {
    clean.dept = null;
  }

  // Resolve CareGroup
  if (clean.careGroup) {
    const rawGroup = String(clean.careGroup).trim();
    if (mongoose.Types.ObjectId.isValid(rawGroup)) {
      clean.careGroup = rawGroup;
    } else if (rawGroup && rawGroup !== 'none') {
      const gDoc = await CareGroup.findOne({
        $or: [
          { customId: rawGroup },
          { name: new RegExp('^' + escapeRegex(rawGroup) + '$', 'i') }
        ]
      });
      clean.careGroup = gDoc ? gDoc._id : null;
    } else {
      clean.careGroup = null;
    }
  } else {
    clean.careGroup = null;
  }

  // Resolve Facilitator
  if (clean.facilitator) {
    const rawFac = String(clean.facilitator).trim();
    if (mongoose.Types.ObjectId.isValid(rawFac)) {
      clean.facilitator = rawFac;
    } else if (rawFac && rawFac !== 'none') {
      const fDoc = await Devotee.findOne({
        $or: [
          { customId: rawFac },
          { name: new RegExp('^' + escapeRegex(rawFac) + '$', 'i') }
        ]
      });
      clean.facilitator = fDoc ? fDoc._id : null;
    } else {
      clean.facilitator = null;
    }
  } else {
    clean.facilitator = null;
  }

  // Date fields cleanup
  if (clean.dob === '' || clean.dob === 'null' || clean.dob === null) {
    delete clean.dob;
  } else if (clean.dob) {
    const d = new Date(clean.dob);
    if (isNaN(d.getTime())) delete clean.dob;
    else clean.dob = d;
  }

  if (clean.joined === '' || clean.joined === 'null' || clean.joined === null) {
    clean.joined = new Date();
  } else if (clean.joined) {
    const d = new Date(clean.joined);
    if (isNaN(d.getTime())) clean.joined = new Date();
    else clean.joined = d;
  }

  // Ensure unique customId or generate one if not present or blank
  if (!clean.customId || clean.customId.trim() === '') {
    clean.customId = 'd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  }

  // Ensure status is valid
  const validStatuses = ['Active', 'New', 'Inactive', 'Alumni', 'Pending Approval', 'Irregular', 'Graduated'];
  if (!clean.status || !validStatuses.includes(clean.status)) {
    clean.status = 'Active';
  }

  return clean;
}

const getRoleFromAppointment = (appt, isFacilitator) => {
  const a = (appt || '').toLowerCase();
  if (a.includes('area leader')) return 'area_leader';
  if (a.includes('overall coordinator') || (a.includes('coordinator') && !a.includes('batch'))) return 'coordinator';
  if (a.includes('preaching manager')) return 'preaching_manager';
  if (a.includes('care manager')) return 'care_manager';
  if (a.includes('internal manager')) return 'internal_manager';
  if (a.includes('department head') || a.includes('dept head')) return 'dept_head';
  if (a.includes('preaching coordinator')) return 'preaching_coord';
  if (a.includes('facilitator') || isFacilitator) return 'facilitator';
  return 'devotee';
};

const requireDeleteDevoteePermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  const userEmail = (req.user.email || '').toLowerCase().trim();
  const r = req.user.role || '';
  const isAllowed = r === 'admin' || r === 'area_leader' || r === 'preaching_manager' || r === 'coordinator' ||
    userEmail.includes('terkadamba') || userEmail === 'suryakiranjune2@gmail.com';
  if (isAllowed) return next();
  return res.status(403).json({ success: false, message: 'Access denied: Requires Admin, Area Leader, or Preaching Head privileges to delete devotee data' });
};

const getDevoteeQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { customId: id }] };
  }
  return { customId: id };
};

const isAdminDevotee = (doc) => {
  if (!doc) return false;
  const email = (doc.email || '').toLowerCase().trim();
  if (email.includes('terkadamba')) return true;
  if (doc.appointment === 'BACE Administrator' || doc.appointment === 'System Administrator') return true;
  if (doc.name === 'ISKCON BACE Admin') return true;
  return false;
};

// @route   GET /api/devotees
// @desc    Get all devotees (with optional query filters, excluding BACE Administrator)
router.get('/', async (req, res) => {
  try {
    const { status, level, dept, batch, search } = req.query;
    const filter = {
      email: { $not: /terkadamba/i },
      appointment: { $nin: ['BACE Administrator', 'System Administrator'] },
      name: { $ne: 'ISKCON BACE Admin' }
    };

    if (status) filter.status = status;
    if (level !== undefined) filter.level = Number(level);
    if (dept) filter.dept = dept;
    if (batch) filter.batch = batch;
    if (search) {
      filter.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { org: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const devotees = await Devotee.find(filter)
      .populate('dept', 'name icon')
      .populate('batch', 'name level')
      .populate('careGroup', 'name')
      .populate('facilitator', 'name')
      .populate('mentor', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: devotees.length, data: devotees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/devotees/:id
// @desc    Get single devotee by ID (excludes BACE administrator)
router.get('/:id', async (req, res) => {
  try {
    const query = getDevoteeQuery(req.params.id);
    const devotee = await Devotee.findOne(query)
      .populate('dept')
      .populate('batch')
      .populate('careGroup')
      .populate('facilitator', 'name phone')
      .populate('mentor', 'name phone')
      .populate('friends', 'name');

    if (!devotee || isAdminDevotee(devotee)) {
      return res.status(404).json({ success: false, message: 'Devotee not found' });
    }

    res.json({ success: true, data: devotee });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/devotees
// @desc    Create a new devotee
router.post('/', async (req, res) => {
  try {
    if (isAdminDevotee(req.body) || req.body.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot create BACE Administrator devotee profile' });
    }
    const resolvedData = await resolveDevoteeRelations(req.body);

    // If customId already exists on an existing devotee, check whether to update or assign fresh customId
    if (resolvedData.customId) {
      const existingWithCustomId = await Devotee.findOne({ customId: resolvedData.customId });
      if (existingWithCustomId) {
        if ((resolvedData.email && existingWithCustomId.email && resolvedData.email.toLowerCase().trim() === existingWithCustomId.email.toLowerCase().trim()) ||
            (resolvedData.name && existingWithCustomId.name && resolvedData.name.toLowerCase().trim() === existingWithCustomId.name.toLowerCase().trim())) {
          const updated = await Devotee.findByIdAndUpdate(existingWithCustomId._id, resolvedData, { new: true, runValidators: true });
          return res.status(200).json({ success: true, data: updated, isUpdate: true });
        } else {
          resolvedData.customId = 'd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        }
      }
    }

    const devotee = await Devotee.create(resolvedData);
    res.status(201).json({ success: true, data: devotee });
  } catch (err) {
    console.error('Error in POST /api/devotees:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/devotees/:id
// @desc    Update a devotee
router.put('/:id', async (req, res) => {
  try {
    const query = getDevoteeQuery(req.params.id);
    let existing = await Devotee.findOne(query);

    // Fallback match by email or name if ID not found
    if (!existing && (req.body.email || req.body.name)) {
      existing = await Devotee.findOne({
        $or: [
          ...(req.body.email ? [{ email: req.body.email.toLowerCase().trim() }] : []),
          ...(req.body.name ? [{ name: new RegExp('^' + escapeRegex(req.body.name.trim()) + '$', 'i') }] : [])
        ]
      });
    }

    if (!existing || isAdminDevotee(existing)) {
      // Seamless creation if devotee doesn't exist yet
      if (isAdminDevotee(req.body) || req.body.role === 'admin') {
        return res.status(400).json({ success: false, message: 'Cannot create BACE Administrator devotee profile' });
      }
      const resolvedData = await resolveDevoteeRelations(req.body);
      const devotee = await Devotee.create(resolvedData);
      return res.status(201).json({ success: true, data: devotee, createdViaPut: true });
    }

    if (req.body.role === 'admin' || req.body.appointment === 'BACE Administrator' || req.body.appointment === 'System Administrator') {
      return res.status(400).json({ success: false, message: 'Cannot assign BACE Administrator role to a devotee' });
    }

    const resolvedData = await resolveDevoteeRelations(req.body);

    const devotee = await Devotee.findByIdAndUpdate(
      existing._id,
      resolvedData,
      { new: true, runValidators: true }
    );

    const roleToSet = req.body.role || (req.body.appointment ? getRoleFromAppointment(req.body.appointment, devotee.isFacilitator) : null);
    if (roleToSet && roleToSet !== 'admin') {
      const userUpdate = { role: roleToSet };
      if (Array.isArray(req.body.roles)) {
        userUpdate.roles = req.body.roles;
      }
      await User.updateMany(
        { $or: [{ devotee: devotee._id }, ...(devotee.email ? [{ email: devotee.email.toLowerCase().trim() }] : [])] },
        { $set: userUpdate }
      );
    }

    res.json({ success: true, data: devotee });
  } catch (err) {
    console.error('Error in PUT /api/devotees/:id:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/devotees/:id
// @desc    Delete a devotee and permanently remove user accounts so devotee must re-register
router.delete('/:id', protect, requireDeleteDevoteePermission, async (req, res) => {
  try {
    const query = getDevoteeQuery(req.params.id);
    const existing = await Devotee.findOne(query);
    if (!existing || isAdminDevotee(existing)) {
      return res.status(404).json({ success: false, message: 'Devotee not found' });
    }

    const devotee = await Devotee.findOneAndDelete(query);

    // Delete associated user account(s) so they cannot login with active session and must re-register
    await User.deleteMany({
      $or: [
        { devotee: devotee._id },
        ...(devotee.email ? [{ email: devotee.email.toLowerCase().trim() }] : [])
      ]
    });

    res.json({ success: true, message: `Devotee ${devotee.name} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/devotees/:id/assign-role
// @desc    Assign hierarchy role(s) to devotee and update user account privileges immediately
router.post('/:id/assign-role', protect, async (req, res) => {
  try {
    const query = getDevoteeQuery(req.params.id);
    const devotee = await Devotee.findOne(query);
    if (!devotee || isAdminDevotee(devotee)) {
      return res.status(404).json({ success: false, message: 'Devotee not found' });
    }
    const { role, roles } = req.body;
    const roleTitles = {
      area_leader: 'Area Leader',
      coordinator: 'Overall Coordinator',
      internal_manager: 'Internal Manager',
      preaching_manager: 'Preaching Manager',
      care_manager: 'Devotee Care Manager',
      dept_head: 'Department Head',
      preaching_coord: 'Preaching Coordinator',
      facilitator: 'Facilitator',
      devotee: 'Devotee'
    };
    
    let selectedRoles = Array.isArray(roles) && roles.length ? roles : (role ? [role] : ['devotee']);
    selectedRoles = selectedRoles.filter(r => r && r !== 'admin' && roleTitles[r]);
    if (selectedRoles.length === 0) selectedRoles = ['devotee'];

    const rolePriority = ['admin', 'area_leader', 'coordinator', 'internal_manager', 'preaching_manager', 'care_manager', 'dept_head', 'preaching_coord', 'facilitator', 'devotee'];
    selectedRoles.sort((a,b) => rolePriority.indexOf(a) - rolePriority.indexOf(b));

    const primaryRole = selectedRoles[0];
    const titles = selectedRoles.map(r => roleTitles[r] || 'Devotee');
    const appointmentStr = titles.join(', ');

    devotee.appointment = appointmentStr;
    devotee.appointments = titles;
    devotee.roles = selectedRoles;
    devotee.isFacilitator = selectedRoles.includes('facilitator');
    await devotee.save();

    await User.updateMany(
      { $or: [{ devotee: devotee._id }, ...(devotee.email ? [{ email: devotee.email.toLowerCase().trim() }] : [])] },
      { $set: { role: primaryRole, roles: selectedRoles } }
    );

    res.json({
      success: true,
      message: `${devotee.name} is now assigned as ${appointmentStr}`,
      devotee,
      role: primaryRole,
      roles: selectedRoles
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/devotees/bulk
// @desc    Bulk insert / sync devotees (e.g. from frontend DB seed)
router.post('/bulk', async (req, res) => {
  try {
    const { devotees } = req.body;
    if (!Array.isArray(devotees)) {
      return res.status(400).json({ success: false, message: 'devotees array required' });
    }

    const filteredDevotees = devotees.filter(d => !isAdminDevotee(d) && d.role !== 'admin');
    const result = await Devotee.insertMany(filteredDevotees, { ordered: false });
    res.status(201).json({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   POST /api/devotees/import-csv
// @desc    Import/upload devotees from CSV with upsert (update existing names, add new, no repetitions)
// @access  Protected: Batch Coordinator (for assigned batch), Area Leader, Admin
router.post('/import-csv', protect, requireDevoteeImportPermission, async (req, res) => {
  try {
    const { devotees, targetBatchId } = req.body;

    if (!Array.isArray(devotees) || devotees.length === 0) {
      return res.status(400).json({ success: false, message: 'Devotees array is required and cannot be empty' });
    }

    // Load reference data for mapping names/customIds to ObjectIds
    const [allBatches, allDepts, allCareGroups] = await Promise.all([
      Batch.find({}),
      Department.find({}),
      CareGroup.find({})
    ]);

    const batchMap = new Map();
    allBatches.forEach(b => {
      batchMap.set(String(b._id), b._id);
      if (b.customId) batchMap.set(b.customId.toLowerCase(), b._id);
      batchMap.set(b.name.toLowerCase().trim(), b._id);
    });

    const deptMap = new Map();
    allDepts.forEach(d => {
      deptMap.set(String(d._id), d._id);
      if (d.customId) deptMap.set(d.customId.toLowerCase(), d._id);
      deptMap.set(d.name.toLowerCase().trim(), d._id);
    });

    const careGroupMap = new Map();
    allCareGroups.forEach(g => {
      careGroupMap.set(String(g._id), g._id);
      if (g.customId) careGroupMap.set(g.customId.toLowerCase(), g._id);
      careGroupMap.set(g.name.toLowerCase().trim(), g._id);
    });

    // Load facilitators from hierarchy for mapping
    const allFacilitatorDevs = await Devotee.find({
      $or: [
        { isFacilitator: true },
        { appointment: /facilitator/i }
      ]
    });
    const facMap = new Map();
    allFacilitatorDevs.forEach(f => {
      facMap.set(String(f._id), f._id);
      if (f.customId) facMap.set(f.customId.toLowerCase(), f._id);
      facMap.set(f.name.toLowerCase().trim(), f._id);
    });

    // Check scope for Batch Coordinator
    const isRestrictedCoordinator = !req.importScope.all && req.importScope.isBatchCoordinator;
    const allowedBatchIds = (req.importScope.coordinatedBatchIds || []).map(String);

    let defaultBatchObjectId = null;
    if (targetBatchId && batchMap.has(String(targetBatchId))) {
      defaultBatchObjectId = batchMap.get(String(targetBatchId));
    } else if (isRestrictedCoordinator && allowedBatchIds.length > 0) {
      defaultBatchObjectId = batchMap.get(allowedBatchIds[0]) || null;
    }

    let addedCount = 0;
    let updatedCount = 0;
    const processedDevotees = [];

    for (const row of devotees) {
      const rawName = String(row.name || row.devotee || row['Devotee Name'] || '').trim();
      if (!rawName) continue;

      if (isAdminDevotee(row) || rawName === 'ISKCON BACE Admin' || (row.email && row.email.includes('terkadamba'))) {
        continue;
      }

      // Resolve batch
      let resolvedBatchId = defaultBatchObjectId;
      const batchInput = row.batch || row.batchName || row['Batch'];
      if (batchInput) {
        const cleanB = String(batchInput).toLowerCase().trim();
        if (batchMap.has(cleanB)) {
          resolvedBatchId = batchMap.get(cleanB);
        } else if (batchMap.has(String(batchInput))) {
          resolvedBatchId = batchMap.get(String(batchInput));
        }
      }

      // If restricted coordinator, enforce that devotee belongs to allowed batch
      if (isRestrictedCoordinator) {
        if (resolvedBatchId && !allowedBatchIds.includes(String(resolvedBatchId))) {
          // If row specified an unauthorized batch, lock to their authorized batch
          resolvedBatchId = defaultBatchObjectId || (allowedBatchIds[0] ? (batchMap.get(allowedBatchIds[0]) || null) : null);
        } else if (!resolvedBatchId && defaultBatchObjectId) {
          resolvedBatchId = defaultBatchObjectId;
        }
      }

      // Resolve department
      let resolvedDeptId = null;
      const deptInput = row.dept || row.department || row['Department'];
      if (deptInput) {
        const cleanD = String(deptInput).toLowerCase().trim();
        if (deptMap.has(cleanD)) {
          resolvedDeptId = deptMap.get(cleanD);
        } else if (deptMap.has(String(deptInput))) {
          resolvedDeptId = deptMap.get(String(deptInput));
        }
      }

      // Resolve care group
      let resolvedCareGroupId = null;
      const cgInput = row.careGroup || row['Care Group'];
      if (cgInput) {
        const cleanG = String(cgInput).toLowerCase().trim();
        if (careGroupMap.has(cleanG)) {
          resolvedCareGroupId = careGroupMap.get(cleanG);
        }
      }

      // Resolve facilitator from hierarchy
      let resolvedFacilitatorId = null;
      const facInput = row.facilitator || row['Facilitator'] || row.guide || row.mentor;
      if (facInput) {
        const cleanF = String(facInput).toLowerCase().trim();
        if (facMap.has(cleanF)) {
          resolvedFacilitatorId = facMap.get(cleanF);
        } else {
          const fallbackDev = await Devotee.findOne({
            $or: [
              { name: new RegExp(`^${escapeRegex(cleanF)}$`, 'i') },
              { customId: cleanF }
            ]
          });
          if (fallbackDev) resolvedFacilitatorId = fallbackDev._id;
        }
      }

      // 1. Search for existing devotee by Name (case-insensitive, exact match)
      const nameRegex = new RegExp(`^${escapeRegex(rawName)}$`, 'i');
      let existing = await Devotee.findOne({ name: nameRegex });

      // Fallback: If not matched by name, but email is provided and matches
      if (!existing && row.email && String(row.email).trim().length > 3) {
        const cleanEmail = String(row.email).toLowerCase().trim();
        existing = await Devotee.findOne({ email: cleanEmail });
      }

      if (existing) {
        // Protect BACE Administrator
        if (isAdminDevotee(existing)) continue;

        // If batch coordinator is updating, ensure devotee is in their batch
        if (isRestrictedCoordinator && existing.batch && !allowedBatchIds.includes(String(existing.batch))) {
          continue;
        }

        // UPDATE existing devotee (No repetitions!)
        if (row.phone) existing.phone = String(row.phone).trim();
        if (row.email && !existing.email) existing.email = String(row.email).toLowerCase().trim();
        else if (row.email) existing.email = String(row.email).toLowerCase().trim();

        if (row.residence) existing.residence = String(row.residence).trim();
        if (row.address) existing.address = String(row.address).trim();
        if (row.attendanceMode) existing.attendanceMode = String(row.attendanceMode).trim();
        if (row.batchRole) existing.batchRole = String(row.batchRole).trim();
        if (resolvedBatchId) existing.batch = resolvedBatchId;
        if (resolvedDeptId) existing.dept = resolvedDeptId;
        if (resolvedCareGroupId) existing.careGroup = resolvedCareGroupId;
        if (resolvedFacilitatorId) existing.facilitator = resolvedFacilitatorId;

        if (row.status) existing.status = String(row.status).trim();
        if (row.level !== undefined && row.level !== '') existing.level = Number(row.level);
        if (row.org) existing.org = String(row.org).trim();
        if (row.occupation) existing.occupation = String(row.occupation).trim();
        if (row.highestEducation) existing.highestEducation = String(row.highestEducation).trim();
        if (row.presentStudiesOrJob) existing.presentStudiesOrJob = String(row.presentStudiesOrJob).trim();
        if (row.emergency) existing.emergency = String(row.emergency).trim();
        if (row.attendancePct !== undefined && row.attendancePct !== '') existing.attendancePct = Math.min(100, Math.max(0, Number(row.attendancePct)));
        if (row.appointment && row.appointment !== 'BACE Administrator' && row.appointment !== 'System Administrator') {
          existing.appointment = String(row.appointment).trim();
        }

        if (row.rounds !== undefined && row.rounds !== '') {
          existing.sadhana = existing.sadhana || {};
          existing.sadhana.rounds = Math.min(64, Math.max(0, Number(row.rounds)));
        }

        if (row.skills) {
          const skillsArr = Array.isArray(row.skills) ? row.skills : String(row.skills).split(',').map(s => s.trim()).filter(Boolean);
          if (skillsArr.length) {
            existing.skills = Array.from(new Set([...(existing.skills || []), ...skillsArr]));
          }
        }

        if (row.joined) {
          const parsedDate = new Date(row.joined);
          if (!isNaN(parsedDate.getTime())) existing.joined = parsedDate;
        }

        if (row.gender) {
          existing.gender = (String(row.gender).toLowerCase().startsWith('f')) ? 'Female' : 'Male';
        }
        await existing.save();

        // Populate relationships for response
        const populated = await Devotee.findById(existing._id)
          .populate('dept', 'name icon')
          .populate('batch', 'name level')
          .populate('careGroup', 'name')
          .populate('facilitator', 'name');

        processedDevotees.push(populated);
        updatedCount++;
      } else {
        // CREATE new devotee
        const customId = `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const resolvedGender = (row.gender && String(row.gender).toLowerCase().startsWith('f')) ? 'Female' : 'Male';
        const newDevoteeData = {
          customId,
          name: rawName,
          gender: resolvedGender,
          phone: row.phone ? String(row.phone).trim() : '',
          email: row.email ? String(row.email).toLowerCase().trim() : undefined,
          residence: row.residence ? String(row.residence).trim() : '',
          address: row.address ? String(row.address).trim() : '',
          attendanceMode: row.attendanceMode ? String(row.attendanceMode).trim() : 'Offline at BACE',
          batchRole: row.batchRole ? String(row.batchRole).trim() : 'Member',
          batch: resolvedBatchId || null,
          dept: resolvedDeptId || null,
          careGroup: resolvedCareGroupId || null,
          facilitator: resolvedFacilitatorId || null,
          status: row.status ? String(row.status).trim() : 'Active',
          level: row.level !== undefined && row.level !== '' ? Number(row.level) : (resolvedBatchId ? 1 : 0),
          org: row.org ? String(row.org).trim() : 'IIT Delhi',
          occupation: row.occupation ? String(row.occupation).trim() : 'Student',
          highestEducation: row.highestEducation ? String(row.highestEducation).trim() : '',
          presentStudiesOrJob: row.presentStudiesOrJob ? String(row.presentStudiesOrJob).trim() : '',
          emergency: row.emergency ? String(row.emergency).trim() : '',
          attendancePct: row.attendancePct !== undefined && row.attendancePct !== '' ? Math.min(100, Math.max(0, Number(row.attendancePct))) : 85,
          appointment: (row.appointment && row.appointment !== 'BACE Administrator') ? String(row.appointment).trim() : null,
          joined: (row.joined && !isNaN(new Date(row.joined).getTime())) ? new Date(row.joined) : new Date(),
          sadhana: {
            rounds: row.rounds !== undefined && row.rounds !== '' ? Math.min(64, Math.max(0, Number(row.rounds))) : 0,
            morningProgram: 0
          },
          skills: Array.isArray(row.skills) ? row.skills : (row.skills ? String(row.skills).split(',').map(s => s.trim()).filter(Boolean) : [])
        };

        const created = await Devotee.create(newDevoteeData);
        const populated = await Devotee.findById(created._id)
          .populate('dept', 'name icon')
          .populate('batch', 'name level')
          .populate('careGroup', 'name')
          .populate('facilitator', 'name');

        processedDevotees.push(populated);
        addedCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${processedDevotees.length} devotees (${addedCount} added, ${updatedCount} updated)`,
      total: processedDevotees.length,
      added: addedCount,
      updated: updatedCount,
      data: processedDevotees
    });
  } catch (err) {
    console.error('Import CSV error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

