'use strict';
const { Session, Event, AuditLog, User } = require('../models');
const { Op } = require('sequelize');

const resolveEventId = async (explicit) => {
  const active = await Event.findOne({
    where: { status: { [Op.notIn]: ['finished', 'closed'] } },
    order: [['starts_at', 'DESC']],
  });
  return active ? active.id : null;
};

const getSessions = async (req, res) => {
  try {
    const { event_id } = req.query;
    const where = event_id ? { event_id } : {};
    const sessions = await Session.findAll({
      where,
      include: [{ model: User, as: 'mentor', attributes: ['id', 'name'] }],
      order: [['starts_at', 'ASC']],
    });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createSession = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { event_id, order, type, title, challenge, starts_at, mentor_id } = req.body;

    const eventId = await resolveEventId(event_id);
    if (!eventId) {
      return res.status(400).json({ message: 'No active event found.' });
    }

    const session = await Session.create({
      event_id: eventId,
      order: order || 0,
      type: type || 'masterclass',
      title,
      challenge: challenge || null,
      starts_at: starts_at || null,
      mentor_id: mentor_id || null,
    });

    await AuditLog.create({
      actor_id: organizerId,
      action: 'create_session',
      entity: 'Session',
      entity_id: session.id,
    });

    const created = await Session.findByPk(session.id, {
      include: [{ model: User, as: 'mentor', attributes: ['id', 'name'] }],
    });

    res.status(201).json({ session: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSession = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { id } = req.params;
    const { order, type, title, challenge, starts_at, mentor_id } = req.body;

    const session = await Session.findByPk(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (order !== undefined) session.order = order;
    if (type !== undefined) session.type = type;
    if (title !== undefined) session.title = title;
    if (challenge !== undefined) session.challenge = challenge;
    if (starts_at !== undefined) session.starts_at = starts_at;
    if (mentor_id !== undefined) session.mentor_id = mentor_id;

    await session.save();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'update_session',
      entity: 'Session',
      entity_id: session.id,
    });

    const updated = await Session.findByPk(session.id, {
      include: [{ model: User, as: 'mentor', attributes: ['id', 'name'] }],
    });

    res.json({ session: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { id } = req.params;

    const session = await Session.findByPk(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await session.destroy();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'delete_session',
      entity: 'Session',
      entity_id: id,
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSessions, createSession, updateSession, deleteSession };