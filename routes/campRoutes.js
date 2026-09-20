const express = require('express');
const router = express.Router();
const { Camp } = require('../models');

const DEFAULT_CAMPS = [
  {
    customId: 'camp_1',
    name: 'Vrindavan Kartik Maha-Retreat',
    type: '3-Day Annual Dham Retreat',
    badge: 'Kartik Vrata',
    dates: '18 – 20 Oct 2026',
    loc: 'Sri Vrindavan Dham (Krishna Balaram Mandir & Govardhan)',
    lead: 'HG Audarya Gour Das',
    desc: 'Annual flagship Kartik retreat: Radha Damodar parikrama, Govardhan circumambulation, Deep Daan on Yamuna, and evening ecstatic kirtan.',
    participants: 38,
    status: 'Open'
  },
  {
    customId: 'camp_2',
    name: 'Mayapur Gaur Purnima International Camp',
    type: '4-Day Spiritual Intensive',
    badge: 'Navadvip Mandal',
    dates: '21 – 25 Mar 2026',
    loc: 'Sridham Mayapur (World Headquarters)',
    lead: 'Madhava Das',
    desc: 'Annual assembly at the spiritual capital: Navadvip parikrama on foot, darshan of Pancha Tattva, and participating in the international Kirtan Mela.',
    participants: 32,
    status: 'Annual'
  },
  {
    customId: 'camp_3',
    name: 'Jagannath Puri Dham Ratha Yatra Camp',
    type: '3-Day Coastal Pilgrimage',
    badge: 'Ratha Yatra',
    dates: '02 – 05 Jul 2026',
    loc: 'Sri Jagannath Puri Dham, Odisha',
    lead: 'Sundar Gopal Das',
    desc: 'Participating in the divine chariot festival: Gundicha Marjana, singing before Lord Jagannath, Tota Gopinath darshan, and ocean bathing.',
    participants: 29,
    status: 'Completed'
  }
];

// Seed initial camps if none exist
async function ensureSeedCamps() {
  try {
    const count = await Camp.countDocuments();
    if (count === 0) {
      await Camp.insertMany(DEFAULT_CAMPS);
      console.log('Seeded initial flagship camps into MongoDB');
    }
  } catch (err) {
    console.error('Error seeding initial camps:', err.message);
  }
}

// @route   GET /api/camps
// @desc    Get all flagship camps / retreats
router.get('/', async (req, res) => {
  try {
    await ensureSeedCamps();
    const camps = await Camp.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: camps.length,
      camps
    });
  } catch (err) {
    console.error('Error fetching camps:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/camps
// @desc    Create a new camp / retreat
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.customId) {
      data.customId = `camp_${Date.now().toString(36)}`;
    }
    const camp = new Camp(data);
    await camp.save();
    res.status(201).json({
      success: true,
      camp
    });
  } catch (err) {
    console.error('Error creating camp:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/camps/:id
// @desc    Update an existing camp / retreat
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = id.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const camp = await Camp.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }
    res.json({
      success: true,
      camp
    });
  } catch (err) {
    console.error('Error updating camp:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/camps/:id
// @desc    Delete a camp / retreat
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = id.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const camp = await Camp.findOneAndDelete(filter);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }
    res.json({
      success: true,
      message: 'Camp deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting camp:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
