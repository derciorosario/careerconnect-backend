'use strict';
const { Announcement, User, Event, AuditLog } = require('../models');

const getAnnouncements = async (req, res) => {
  try {
    const { event_id } = req.query;
    const where = event_id ? { event_id } : {};

    const announcements = await Announcement.findAll({
      where,
      include: [{ model: User, as: 'sentBy', attributes: ['id', 'name'] }],
      order: [['sent_at', 'DESC']],
    });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    let { event_id, body } = req.body;
    const organizerId = req.userId;

    // Auto-resolve active event if not provided or 'current'
    if (!event_id || event_id === 'current') {
      const event = await Event.findOne({ where: { status: 'active' } });
      event_id = event ? event.id : null;
    }

    const announcement = await Announcement.create({
      event_id,
      body,
      sent_by: organizerId,
      sent_at: new Date(),
    });

    await AuditLog.create({
      actor_id: organizerId,
      action: 'create_announcement',
      entity: 'Announcement',
      entity_id: announcement.id,
    });

    res.status(201).json({ announcement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAnnouncements, createAnnouncement };
