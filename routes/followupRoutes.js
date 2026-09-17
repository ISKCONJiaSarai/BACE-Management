const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Followup } = require('../models');

// @route   GET /api/followups
// @desc    Get all follow-ups
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.kind) filter.kind = req.query.kind;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assigned) filter.assigned = req.query.assigned;

    const followups = await Followup.find(filter).sort({ due: 1, createdAt: -1 }).lean();

    // Map to normalized frontend format
    const formatted = followups.map(f => ({
      id: f.customId || f._id.toString(),
      _id: f._id.toString(),
      customId: f.customId || f._id.toString(),
      kind: f.kind,
      subject: f.subject,
      subjectName: f.subjectName,
      assigned: f.assigned,
      purpose: f.purpose,
      due: f.due,
      last: f.last,
      status: f.status,
      priority: f.priority,
      notes: f.notes,
      batch: f.batch,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/followups
// @desc    Create or upsert a follow-up
router.post('/', async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload.subject) {
      return res.status(400).json({ success: false, message: 'Subject/Person is required' });
    }

    const customId = payload.customId || payload.id || `fu_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    
    const docData = {
      customId,
      kind: payload.kind || 'Preaching',
      subject: payload.subject,
      subjectName: payload.subjectName || '',
      assigned: payload.assigned || '',
      purpose: payload.purpose || 'Follow-up',
      due: payload.due || new Date().toISOString().slice(0, 10),
      last: payload.last || '',
      status: payload.status || 'Pending',
      priority: payload.priority || 'Medium',
      notes: payload.notes || '',
      batch: payload.batch || ''
    };

    const doc = await Followup.findOneAndUpdate(
      { customId },
      { $set: docData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      data: {
        id: doc.customId,
        _id: doc._id.toString(),
        customId: doc.customId,
        kind: doc.kind,
        subject: doc.subject,
        subjectName: doc.subjectName,
        assigned: doc.assigned,
        purpose: doc.purpose,
        due: doc.due,
        last: doc.last,
        status: doc.status,
        priority: doc.priority,
        notes: doc.notes,
        batch: doc.batch
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/followups/:id
// @desc    Update a follow-up
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const updateFields = { ...req.body };
    delete updateFields._id;

    const doc = await Followup.findOneAndUpdate(
      query,
      { $set: updateFields },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    res.json({
      success: true,
      data: {
        id: doc.customId || doc._id.toString(),
        _id: doc._id.toString(),
        customId: doc.customId,
        kind: doc.kind,
        subject: doc.subject,
        subjectName: doc.subjectName,
        assigned: doc.assigned,
        purpose: doc.purpose,
        due: doc.due,
        last: doc.last,
        status: doc.status,
        priority: doc.priority,
        notes: doc.notes,
        batch: doc.batch
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/followups/:id
// @desc    Delete a follow-up
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const doc = await Followup.findOneAndDelete(query);
    res.json({
      success: true,
      message: 'Follow-up deleted',
      deletedId: id
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/followups/sync
// @desc    Bulk sync follow-ups from frontend
router.post('/sync', async (req, res, next) => {
  try {
    const list = Array.isArray(req.body.followups) ? req.body.followups : [];
    const saved = [];

    for (const item of list) {
      const customId = item.customId || item.id;
      if (!customId) continue;
      const doc = await Followup.findOneAndUpdate(
        { customId },
        {
          $set: {
            customId,
            kind: item.kind || 'Preaching',
            subject: item.subject,
            subjectName: item.subjectName || '',
            assigned: item.assigned || '',
            purpose: item.purpose || 'Follow-up',
            due: item.due,
            last: item.last || '',
            status: item.status || 'Pending',
            priority: item.priority || 'Medium',
            notes: item.notes || '',
            batch: item.batch || ''
          }
        },
        { new: true, upsert: true }
      );
      saved.push(doc);
    }

    res.json({
      success: true,
      count: saved.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
