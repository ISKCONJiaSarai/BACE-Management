const express = require('express');
const router = express.Router();
const { Department } = require('../models');

// @route   GET /api/departments
// @desc    Get all departments from MongoDB
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: 1 });
    res.json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/departments
// @desc    Create or upsert a department
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const cid = d.id || d.customId || `dp_${Date.now().toString(36)}`;
    const updateData = {
      customId: cid,
      name: d.name,
      desc: d.desc || '',
      icon: d.icon || '🏛️',
      color: d.color || '#C9601B',
      category: d.category || 'Facilities',
      reportFreq: d.reportFreq || 'Weekly',
      module: d.module || null,
      head: d.head || null,
      incharge: d.incharge || '',
      assistants: d.assistants || [],
      status: d.status || 'Active',
      perf: typeof d.perf === 'number' ? d.perf : 80,
      budget: d.budget || { allocated: 0, spent: 0 }
    };

    const doc = await Department.findOneAndUpdate(
      { $or: [{ customId: cid }, { name: d.name }] },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      department: doc
    });
  } catch (err) {
    console.error('Error creating/updating department:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update a department by customId or _id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const d = req.body;
    const filter = mongooseIdValid(id) ? { _id: id } : { customId: id };

    const updateFields = {};
    if (d.name !== undefined) updateFields.name = d.name;
    if (d.desc !== undefined) updateFields.desc = d.desc;
    if (d.icon !== undefined) updateFields.icon = d.icon;
    if (d.color !== undefined) updateFields.color = d.color;
    if (d.category !== undefined) updateFields.category = d.category;
    if (d.reportFreq !== undefined) updateFields.reportFreq = d.reportFreq;
    if (d.module !== undefined) updateFields.module = d.module;
    if (d.head !== undefined) updateFields.head = d.head;
    if (d.incharge !== undefined) updateFields.incharge = d.incharge;
    if (d.assistants !== undefined) updateFields.assistants = d.assistants;
    if (d.status !== undefined) updateFields.status = d.status;
    if (d.perf !== undefined) updateFields.perf = d.perf;
    if (d.budget !== undefined) updateFields.budget = d.budget;

    const doc = await Department.findOneAndUpdate(filter, { $set: updateFields }, { new: true });
    if (!doc) {
      // Try fallback by name
      const fallbackDoc = await Department.findOneAndUpdate({ name: d.name || id }, { $set: updateFields }, { new: true });
      if (!fallbackDoc) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      return res.json({ success: true, department: fallbackDoc });
    }

    res.json({
      success: true,
      department: doc
    });
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Archive or remove department
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongooseIdValid(id) ? { _id: id } : { customId: id };

    // Mark as Archived to preserve audit & historical reports
    const doc = await Department.findOneAndUpdate(filter, { $set: { status: 'Archived' } }, { new: true });
    if (!doc) {
      // Try fallback by name
      await Department.findOneAndUpdate({ name: id }, { $set: { status: 'Archived' } });
    }

    res.json({
      success: true,
      message: 'Department marked as Archived in database'
    });
  } catch (err) {
    console.error('Error archiving department:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/departments/sync
// @desc    Bulk sync departments from client to MongoDB
router.post('/sync', async (req, res) => {
  try {
    const { departments } = req.body;
    if (!Array.isArray(departments)) {
      return res.status(400).json({ success: false, message: 'Departments array required' });
    }

    const bulkOps = departments.map(d => {
      const cid = d.id || d.customId || `dp_${Date.now().toString(36)}`;
      return {
        updateOne: {
          filter: { $or: [{ customId: cid }, { name: d.name }] },
          update: {
            $set: {
              customId: cid,
              name: d.name,
              desc: d.desc || '',
              icon: d.icon || '🏛️',
              color: d.color || '#C9601B',
              category: d.category || 'Facilities',
              reportFreq: d.reportFreq || 'Weekly',
              module: d.module || null,
              head: d.head || null,
              incharge: d.incharge || '',
              assistants: d.assistants || [],
              status: d.status || 'Active',
              perf: typeof d.perf === 'number' ? d.perf : 80,
              budget: d.budget || { allocated: 0, spent: 0 }
            }
          },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      await Department.bulkWrite(bulkOps);
    }

    const saved = await Department.find();
    res.json({
      success: true,
      count: saved.length,
      departments: saved
    });
  } catch (err) {
    console.error('Error syncing departments:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

function mongooseIdValid(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

module.exports = router;

