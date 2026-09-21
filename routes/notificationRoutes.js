const express = require('express');
const router = express.Router();
const { Notification } = require('../models');

const SEED_NOTIFICATIONS = [
  {
    customId: 'notif_1',
    devoteeId: 'all',
    em: '🪔',
    title: 'Seva assigned',
    body: 'You are assigned to Sunday feast prasadam cooking & distribution seva.',
    category: 'Management',
    date: new Date().toISOString(),
    read: false,
    link: '#/assign'
  },
  {
    customId: 'notif_2',
    devoteeId: 'all',
    em: '⛺',
    title: 'Kartik Yatra Retreat Registration',
    body: 'Registrations are now open for Vrindavan Kartik Maha-Retreat (18 – 20 Oct). Limited seats available.',
    category: 'Care',
    date: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hrs ago
    read: false,
    link: '#/camps'
  },
  {
    customId: 'notif_3',
    devoteeId: 'all',
    em: '📖',
    title: 'Morning Bhagavata Discourse',
    body: 'Srimad Bhagavatam Canto 1 study session begins tomorrow at 6:45 AM in the Temple Hall.',
    category: 'Preaching',
    date: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hrs ago
    read: false,
    link: '#/calendar'
  },
  {
    customId: 'notif_4',
    devoteeId: 'all',
    em: '📿',
    title: 'Weekly Sadhana Sync',
    body: 'Please record your japa rounds, wake-up time and morning program attendance for this week.',
    category: 'Care',
    date: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    read: false,
    link: '#/swabhav'
  },
  {
    customId: 'notif_5',
    devoteeId: 'all',
    em: '✨',
    title: 'Janmashtami Maha-Abhisheka Planning',
    body: 'Department seva coordinators coordination meeting scheduled for Thursday evening.',
    category: 'Community',
    date: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    read: true,
    link: '#/calendar'
  },
  {
    customId: 'notif_6',
    devoteeId: 'all',
    em: '💬',
    title: 'Batch Update in Gaurvani',
    body: 'Temple cleaning seva roster updated with weekend seva slots.',
    category: 'Messages',
    date: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    read: true,
    link: '#/messages'
  }
];

// Seed initial notifications if collection is empty
async function ensureSeedNotifications() {
  try {
    const count = await Notification.countDocuments();
    if (count === 0) {
      await Notification.insertMany(SEED_NOTIFICATIONS);
      console.log('Seeded initial notifications into MongoDB');
    }
  } catch (err) {
    console.error('Error seeding initial notifications:', err.message);
  }
}

// @route   GET /api/notifications
// @desc    Get all notifications (optionally filtered by devoteeId, category, unread)
router.get('/', async (req, res) => {
  try {
    await ensureSeedNotifications();

    const query = {};
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }
    if (req.query.unread === 'true') {
      query.read = false;
    }
    if (req.query.devoteeId) {
      query.$or = [
        { devoteeId: 'all' },
        { devoteeId: req.query.devoteeId }
      ];
    }

    const notifs = await Notification.find(query).sort({ createdAt: -1, date: -1 }).lean();
    
    // Normalize id field for frontend compatibility
    const formatted = notifs.map(n => ({
      ...n,
      id: n.customId || n._id.toString()
    }));

    const unreadCount = formatted.filter(n => !n.read).length;

    res.json({
      success: true,
      count: formatted.length,
      unreadCount,
      notifications: formatted
    });
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification
router.post('/', async (req, res) => {
  try {
    const { title, body, em, category, devoteeId, link } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const customId = req.body.customId || req.body.id || 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

    const newNotif = await Notification.create({
      customId,
      devoteeId: devoteeId || 'all',
      title: title.trim(),
      body: body.trim(),
      em: em || '🔔',
      category: category || 'General',
      date: req.body.date || new Date().toISOString(),
      read: false,
      link: link || ''
    });

    res.status(201).json({
      success: true,
      notification: {
        ...newNotif.toObject(),
        id: newNotif.customId || newNotif._id.toString()
      }
    });
  } catch (err) {
    console.error('Error creating notification:', err.message);
    res.status(500).json({ success: false, message: 'Server error creating notification' });
  }
});

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all notifications as read
router.post('/mark-all-read', async (req, res) => {
  try {
    const filter = {};
    if (req.body.devoteeId) {
      filter.$or = [
        { devoteeId: 'all' },
        { devoteeId: req.body.devoteeId }
      ];
    }
    const result = await Notification.updateMany(filter, { $set: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error marking all notifications as read:', err.message);
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a specific notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const target = req.params.id;
    let notif = await Notification.findOne({ customId: target });
    if (!notif && target.match(/^[0-9a-fA-F]{24}$/)) {
      notif = await Notification.findById(target);
    }
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notif.read = true;
    await notif.save();

    res.json({
      success: true,
      notification: {
        ...notif.toObject(),
        id: notif.customId || notif._id.toString()
      }
    });
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
});

// Also support PUT /api/notifications/:id/read for broader client compatibility
router.put('/:id/read', async (req, res) => {
  try {
    const target = req.params.id;
    let notif = await Notification.findOne({ customId: target });
    if (!notif && target.match(/^[0-9a-fA-F]{24}$/)) {
      notif = await Notification.findById(target);
    }
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notif.read = true;
    await notif.save();

    res.json({
      success: true,
      notification: {
        ...notif.toObject(),
        id: notif.customId || notif._id.toString()
      }
    });
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const target = req.params.id;
    let deleted = await Notification.findOneAndDelete({ customId: target });
    if (!deleted && target.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Notification.findByIdAndDelete(target);
    }
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Error deleting notification:', err.message);
    res.status(500).json({ success: false, message: 'Server error deleting notification' });
  }
});

// @route   POST /api/notifications/clear-read
// @desc    Delete all read notifications
router.post('/clear-read', async (req, res) => {
  try {
    const filter = { read: true };
    if (req.body.devoteeId) {
      filter.$or = [
        { devoteeId: 'all' },
        { devoteeId: req.body.devoteeId }
      ];
    }
    const result = await Notification.deleteMany(filter);
    res.json({ success: true, message: 'Read notifications cleared', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Error clearing read notifications:', err.message);
    res.status(500).json({ success: false, message: 'Server error clearing notifications' });
  }
});

module.exports = router;
