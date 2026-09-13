const express = require('express');
const router = express.Router();
const { Devotee } = require('../models');

// @route   GET /api/devotees
// @desc    Get all devotees (with optional query filters)
router.get('/', async (req, res) => {
  try {
    const { status, level, dept, batch, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (level !== undefined) filter.level = Number(level);
    if (dept) filter.dept = dept;
    if (batch) filter.batch = batch;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { org: { $regex: search, $options: 'i' } }
      ];
    }

    const devotees = await Devotee.find(filter)
      .populate('dept', 'name color icon')
      .populate('batch', 'name level')
      .populate('careGroup', 'name day time')
      .populate('facilitator', 'name')
      .populate('mentor', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: devotees.length, data: devotees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/devotees/:id
// @desc    Get single devotee by ID
router.get('/:id', async (req, res) => {
  try {
    const devotee = await Devotee.findById(req.params.id)
      .populate('dept')
      .populate('batch')
      .populate('careGroup')
      .populate('facilitator', 'name phone')
      .populate('mentor', 'name phone')
      .populate('friends', 'name');

    if (!devotee) {
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
    const devotee = await Devotee.create(req.body);
    res.status(201).json({ success: true, data: devotee });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/devotees/:id
// @desc    Update a devotee
router.put('/:id', async (req, res) => {
  try {
    const devotee = await Devotee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!devotee) {
      return res.status(404).json({ success: false, message: 'Devotee not found' });
    }

    res.json({ success: true, data: devotee });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/devotees/:id
// @desc    Delete a devotee
router.delete('/:id', async (req, res) => {
  try {
    const devotee = await Devotee.findByIdAndDelete(req.params.id);

    if (!devotee) {
      return res.status(404).json({ success: false, message: 'Devotee not found' });
    }

    res.json({ success: true, message: 'Devotee deleted successfully' });
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

    const result = await Devotee.insertMany(devotees, { ordered: false });
    res.status(201).json({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
