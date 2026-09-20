const express = require('express');
const router = express.Router();
const { Outing } = require('../models');

const DEFAULT_OUTINGS = [
  {
    customId: 'out1',
    name: 'Yamuna Ghat Harinam & Evening Boat Sankirtan',
    category: 'Harinam & Sanga',
    date: '2026-08-11',
    location: 'Nigambodh Ghat, Yamuna River, Old Delhi',
    coordinator: 'd1',
    batch: 'all',
    status: 'Completed',
    highlights: ['Sunset Boat Kirtan', 'Harinam Japa Walk', 'Mahaprasadam Distribution'],
    description: 'Devotees boarded traditional wooden boats at sunset on the Yamuna river for an ecstatic two-hour acoustic Harinam sankirtan, followed by distributing dry sweets prasadam to visitors at the ghat.',
    attendees: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7']
  },
  {
    customId: 'out2',
    name: 'Deer Park Morning Japa Walk & Sloka Recitation Picnic',
    category: 'Nature Walk & Picnic',
    date: '2026-10-05',
    location: 'Deer Park & Lake, Hauz Khas (Near IIT Delhi)',
    coordinator: 'd2',
    batch: 'b7',
    status: 'Upcoming',
    highlights: ['16-Round Japa Session', 'Gita Chapter 12 Memorisation Quiz', 'Outdoor Fruit & Poha Feast'],
    description: 'Annual autumn morning japa retreat in the lush wooded trails of Deer Park adjacent to Jia Sarai. Focus on focused attentive chanting in nature, memory verse contest, and breakfast prasadam on the lawn.',
    attendees: ['d1', 'd2', 'd3', 'd8', 'd9']
  },
  {
    customId: 'out3',
    name: 'ISKCON Glory of India Cultural Centre & Vedic Museum Day Trip',
    category: 'Temple Darshan',
    date: '2026-07-07',
    location: 'ISKCON Sant Nagar, East of Kailash',
    coordinator: 'd3',
    batch: 'b8',
    status: 'Completed',
    highlights: ['Gita Animatronics Show', 'Srila Prabhupada Museum', 'Govinda’s Prasadam Buffet'],
    description: 'Full-day orientation and pilgrimage for youth and first-year BACE candidates. Guided tour of the world-famous animatronics Bhagavad Gita exhibition, darshan of Sri Sri Radha Parthasarathi, and lunch at Govinda’s.',
    attendees: ['d3', 'd4', 'd5', 'd6', 'd7']
  },
  {
    customId: 'out4',
    name: 'Hauz Khas Rose Garden Devotee Bonding & Team Sanga',
    category: 'Community Picnic',
    date: '2026-06-02',
    location: 'Rose Garden & Monument Lake, Hauz Khas',
    coordinator: 'd4',
    batch: 'all',
    status: 'Completed',
    highlights: ['Spiritual Icebreakers', 'Care Circles Check-in', 'Evening Acoustic Kirtan'],
    description: 'A relaxed Sunday afternoon outing centered around devotee friendships, team bonding games, sharing student-life challenges and realizations, followed by outdoor kirtan as dusk settled.',
    attendees: ['d1', 'd4', 'd5', 'd8']
  },
  {
    customId: 'out5',
    name: 'Kurukshetra Gita Jayanti Holy Dham Day Pilgrimage',
    category: 'Historic Dham Day Trip',
    date: '2026-11-04',
    location: 'Jyotisar & Brahma Sarovar, Kurukshetra, Haryana',
    coordinator: 'd1',
    batch: 'all',
    status: 'Upcoming',
    highlights: ['700-Verse Gita Recitation', 'Brahma Sarovar Holy Dip', 'AC Bus Harinam Kirtan'],
    description: 'Annual sacred day trip to the battlefield of Kurukshetra where Sri Krishna spoke the Bhagavad Gita to Arjuna. Reciting all 18 chapters together under the Akshaya Vata banyan tree at Jyotisar.',
    attendees: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8']
  },
  {
    customId: 'out6',
    name: 'Sunder Nursery Heritage Garden Japa Walk & Picnic',
    category: 'Nature Walk & Picnic',
    date: '2026-05-03',
    location: 'Sunder Nursery Gardens, Nizamuddin',
    coordinator: 'd5',
    batch: 'all',
    status: 'Completed',
    highlights: ['Lakeside Chanting', 'Canopy Kirtan', 'Summer Thandai & Packed Feast'],
    description: 'Morning meditation walk through the 16th-century heritage park with over 300 tree species. Quiet japa by the lotus pond followed by reading Krishna Book pastimes under the garden pavilion.',
    attendees: ['d2', 'd3', 'd5', 'd7']
  }
];

// Seed initial outings if none exist
async function ensureSeedOutings() {
  try {
    const count = await Outing.countDocuments();
    if (count === 0) {
      await Outing.insertMany(DEFAULT_OUTINGS);
      console.log('Seeded initial community outings into MongoDB');
    }
  } catch (err) {
    console.error('Error seeding initial outings:', err.message);
  }
}

// @route   GET /api/outings
// @desc    Get all community outings
router.get('/', async (req, res) => {
  try {
    await ensureSeedOutings();
    const outings = await Outing.find().sort({ date: -1 });
    res.json({
      success: true,
      count: outings.length,
      outings
    });
  } catch (err) {
    console.error('Error fetching outings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/outings
// @desc    Create a new outing
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.customId) {
      data.customId = `out_${Date.now().toString(36)}`;
    }
    const outing = new Outing(data);
    await outing.save();
    res.status(201).json({
      success: true,
      outing
    });
  } catch (err) {
    console.error('Error creating outing:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/outings/:id
// @desc    Update an existing outing
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = id.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const outing = await Outing.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!outing) {
      return res.status(404).json({ success: false, message: 'Outing not found' });
    }
    res.json({
      success: true,
      outing
    });
  } catch (err) {
    console.error('Error updating outing:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/outings/:id
// @desc    Delete an outing
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = id.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const outing = await Outing.findOneAndDelete(filter);
    if (!outing) {
      return res.status(404).json({ success: false, message: 'Outing not found' });
    }
    res.json({
      success: true,
      message: 'Outing deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting outing:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
