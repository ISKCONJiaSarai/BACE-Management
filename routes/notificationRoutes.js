const express = require('express');
const router = express.Router();
const { Notification, Camp, Outing, Devotee, MorningAttendance } = require('../models');

// Clean up any historical dummy seed notifications once on module load
(async function cleanupDummySeedNotifications() {
  try {
    await Notification.deleteMany({
      customId: { $in: ['notif_1', 'notif_2', 'notif_3', 'notif_4', 'notif_5', 'notif_6'] }
    });
  } catch (err) {
    console.warn('Notice cleaning up dummy notifications:', err.message);
  }
})();

/**
 * Synchronize REAL system notifications based on live MongoDB records
 * (e.g. open camps, upcoming outings, pending devotee approvals)
 */
async function syncRealSystemNotifications() {
  try {
    // 1. Check for real open camps (e.g. Vrindavan Kartik Maha-Retreat)
    const openCamps = await Camp.find({ status: 'Open' }).lean();
    for (const camp of openCamps) {
      const notifId = 'camp_' + (camp.customId || camp._id.toString());
      const exists = await Notification.findOne({ customId: notifId });
      if (!exists) {
        await Notification.create({
          customId: notifId,
          devoteeId: 'all',
          title: `Registration Open: ${camp.name}`,
          body: camp.desc ? camp.desc.slice(0, 160) : `${camp.type || 'Camp'} scheduled for ${camp.dates} at ${camp.loc}.`,
          em: '⛺',
          category: 'Care',
          link: '#/camps',
          read: false,
          date: new Date().toISOString()
        });
      }
    }

    // 2. Check for real pending devotee registrations awaiting leader approval
    const pendingDevotees = await Devotee.find({ status: 'pending' }).lean();
    for (const dev of pendingDevotees) {
      const notifId = 'dev_pending_' + (dev.customId || dev._id.toString());
      const exists = await Notification.findOne({ customId: notifId });
      if (!exists) {
        await Notification.create({
          customId: notifId,
          devoteeId: 'all',
          title: `Devotee Approval: ${dev.name}`,
          body: `New devotee registration received for ${dev.name} (${dev.phone || 'No phone'}). Please review and approve access.`,
          em: '👤',
          category: 'Management',
          link: '#/devotees',
          read: false,
          date: new Date().toISOString()
        });
      }
    }

    // 3. Check for any upcoming non-completed outings
    const activeOutings = await Outing.find({ status: { $nin: ['Completed', 'completed'] } }).lean();
    for (const outing of activeOutings) {
      const notifId = 'outing_' + (outing.customId || outing._id.toString());
      const exists = await Notification.findOne({ customId: notifId });
      if (!exists) {
        await Notification.create({
          customId: notifId,
          devoteeId: 'all',
          title: `Upcoming Outing: ${outing.name}`,
          body: outing.description ? outing.description.slice(0, 160) : `${outing.category} at ${outing.location} on ${outing.date}.`,
          em: '🚌',
          category: 'Community',
          link: '#/camps',
          read: false,
          date: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error('Error synchronizing real notifications:', err.message);
  }
}

// @route   GET /api/notifications
// @desc    Get all real notifications (optionally filtered by devoteeId, category, unread)
router.get('/', async (req, res) => {
  try {
    await syncRealSystemNotifications();

    const query = {
      dismissed: { $ne: true }
    };

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
    console.error('Error fetching real notifications:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

// @route   POST /api/notifications
// @desc    Create a new real notification
router.post('/', async (req, res) => {
  try {
    const { title, body, em, category, link, devoteeId, customId } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const generatedId = customId || ('notif_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));

    const notification = await Notification.create({
      customId: generatedId,
      devoteeId: devoteeId || 'all',
      title,
      body,
      em: em || '🔔',
      category: category || 'General',
      link: link || '',
      read: false,
      date: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      notification: {
        ...notification.toObject(),
        id: notification.customId || notification._id.toString()
      }
    });
  } catch (err) {
    console.error('Error creating real notification:', err.message);
    res.status(500).json({ success: false, message: 'Server error creating notification' });
  }
});

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all notifications as read
router.post('/mark-all-read', async (req, res) => {
  try {
    const filter = { dismissed: { $ne: true } };
    if (req.body.devoteeId) {
      filter.$or = [
        { devoteeId: 'all' },
        { devoteeId: req.body.devoteeId }
      ];
    }
    const result = await Notification.updateMany(filter, { $set: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error marking all notifications read:', err.message);
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a single notification as read
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

// Also support PUT /api/notifications/:id/read
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
// @desc    Delete a notification permanently (marks as dismissed so sync won't recreate it)
router.delete('/:id', async (req, res) => {
  try {
    const target = req.params.id;
    const query = {
      $or: [
        { customId: target }
      ]
    };
    if (target.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or.push({ _id: target });
    }

    // Mark as dismissed so syncRealSystemNotifications will not recreate it,
    // and remove from active list
    const updated = await Notification.updateMany(query, { $set: { dismissed: true, read: true } });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      deletedCount: updated.modifiedCount
    });
  } catch (err) {
    console.error('Error deleting notification:', err.message);
    res.status(500).json({ success: false, message: 'Server error deleting notification' });
  }
});

// @route   POST /api/notifications/clear-read
// @desc    Clear all read notifications permanently
router.post('/clear-read', async (req, res) => {
  try {
    const filter = { read: true, dismissed: { $ne: true } };
    if (req.body.devoteeId) {
      filter.$or = [
        { devoteeId: 'all' },
        { devoteeId: req.body.devoteeId }
      ];
    }
    const result = await Notification.updateMany(filter, { $set: { dismissed: true } });
    res.json({ success: true, message: 'Read notifications cleared', deletedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error clearing read notifications:', err.message);
    res.status(500).json({ success: false, message: 'Server error clearing notifications' });
  }
});

module.exports = router;
