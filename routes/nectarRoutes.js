const express = require('express');
const router = express.Router();
const { NectarQuote } = require('../models');

const DEFAULT_QUOTES = [
  {
    customId: 'q1',
    quote: "Chant Hare Krishna, do your duty sincerely, and take Krishna prasadam. Then your life will be sublime, free from all anxiety.",
    citation: "Letter to Brahmananda, Los Angeles, 1968",
    topic: "Peace of Mind & Duty",
    order: 1
  },
  {
    customId: 'q2',
    quote: "Books are the basis, preaching is the essence, utility is the principle, and purity is the force.",
    citation: "Foundational Motto given to ISKCON Disciples, 1970",
    topic: "Ashram Culture",
    order: 2
  },
  {
    customId: 'q3',
    quote: "Whatever you do, whatever you eat, whatever you offer or give away—do that as an offering unto Me. Transform all education and work into pure devotion.",
    citation: "Bhagavad-gita As It Is 9.27, Purport",
    topic: "Karma-Yoga & Surrender",
    order: 3
  },
  {
    customId: 'q4',
    quote: "You can show your love for me by how much you cooperate together to maintain and spread this transcendental movement.",
    citation: "Conversations in Sri Vrindavan Dham, 1977",
    topic: "Devotee Cooperation",
    order: 4
  },
  {
    customId: 'q5',
    quote: "One who rises early in the morning during brahma-muhurta and attentively chants the holy names becomes freed from all contamination of material life.",
    citation: "Srimad Bhagavatam 3.20.25, Purport",
    topic: "Morning Sadhana",
    order: 5
  },
  {
    customId: 'q6',
    quote: "Cleanliness is next to godliness. The temple, the rooms, the clothes, the body, and the mind must all be kept pure and spotless for the service of the Lord.",
    citation: "Letter to Satsvarupa, 1971",
    topic: "Swachhata & Purity",
    order: 6
  },
  {
    customId: 'q7',
    quote: "The holy name of Krishna is transcendentally blissful. It bestows all spiritual benedictions, for it is Krishna Himself, the reservoir of all pleasure.",
    citation: "Padma Purana, cited in Nectar of Devotion",
    topic: "The Holy Name",
    order: 7
  },
  {
    customId: 'q8',
    quote: "Devotional service is so pure and perfect that once begun, it never diminishes. Even a small step on this path protects one from the greatest fear.",
    citation: "Bhagavad-gita As It Is 2.40, Purport",
    topic: "Eternal Spiritual Asset",
    order: 8
  },
  {
    customId: 'q9',
    quote: "Simply by hearing the transcendental vibration of Hare Krishna, one's heart is cleansed of all the dust accumulated for many, many births.",
    citation: "Sri Siksastakam 1, Chaitanya Charitamrita",
    topic: "Ceto-Darpana-Marjanam",
    order: 9
  },
  {
    customId: 'q10',
    quote: "Give this youth generation real spiritual culture. When educated students take to Krishna consciousness, the entire world will be transformed.",
    citation: "Room Conversation, New York, 1976",
    topic: "Youth Empowerment",
    order: 10
  }
];

const DEFAULT_TRACKS = [
  {
    id: 'kirtan',
    name: 'Prabhupada Kirtan',
    subtitle: 'Srila Prabhupada Hare Krishna Kirtan',
    icon: '🪕',
    url: '/audio/prabhupada_kirtan.mp3'
  },
  {
    id: 'japa',
    name: 'Prabhupada Japa',
    subtitle: 'Srila Prabhupada Morning Japa Meditation',
    icon: '📿',
    url: '/audio/prabhupada_japa.mp3'
  },
  {
    id: 'govindam',
    name: 'Govindam Aarti',
    subtitle: 'Brahma Samhita Temple Aarti Prayers',
    icon: '🪔',
    url: '/audio/govindam.mp3'
  }
];

// GET /api/nectar - Fetch all quotes (auto-seed if empty)
router.get('/', async (req, res) => {
  try {
    let quotes = await NectarQuote.find().sort({ order: 1, createdAt: 1 });
    if (!quotes || quotes.length === 0) {
      console.log('Seeding initial Srila Prabhupada Nectar quotes to MongoDB...');
      quotes = await NectarQuote.insertMany(DEFAULT_QUOTES);
    }
    res.json({
      success: true,
      quotes
    });
  } catch (err) {
    console.warn('MongoDB Nectar fetch fallback:', err.message);
    res.json({
      success: true,
      quotes: DEFAULT_QUOTES,
      fallback: true
    });
  }
});

// GET /api/nectar/tracks - Return available audio tracks
router.get('/tracks', (req, res) => {
  res.json({
    success: true,
    tracks: DEFAULT_TRACKS
  });
});

// POST /api/nectar - Add a new quote
router.post('/', async (req, res) => {
  try {
    const { quote, citation, topic, order } = req.body;
    if (!quote || !citation) {
      return res.status(400).json({ success: false, message: 'Quote and citation are required' });
    }
    const customId = 'q_' + Date.now().toString(36);
    const newQuote = await NectarQuote.create({
      customId,
      quote,
      citation,
      topic: topic || 'General Vani',
      order: order || 0,
      active: true
    });
    res.status(201).json({ success: true, quote: newQuote });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/nectar/:id - Update a quote
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quote, citation, topic, order, active } = req.body;
    const q = await NectarQuote.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { customId: id }]
    });
    if (!q) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    if (quote !== undefined) q.quote = quote;
    if (citation !== undefined) q.citation = citation;
    if (topic !== undefined) q.topic = topic;
    if (order !== undefined) q.order = order;
    if (active !== undefined) q.active = active;
    await q.save();
    res.json({ success: true, quote: q });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/nectar/:id - Delete a quote
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await NectarQuote.deleteOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { customId: id }]
    });
    res.json({ success: true, message: 'Quote deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
