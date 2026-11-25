'use strict';
const { Event, Session, Speaker, AuditLog } = require('../models');

const getEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { status: 'active' },
      include: [
        { model: Session, as: 'sessions' },
      ],
    });
    if (!event) {
      return res.status(404).json({ message: 'No active event found' });
    }
    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const configureEvent = async (req, res) => {
  try {
    const {
      name, starts_at, ends_at, venue, map_url, capacity,
      round_minutes, rounds_per_break, max_mentees_per_mentor, warn_seconds, tables_count,
      floor_plan, match_weights, landing_texts, status,
    } = req.body;

    let event = await Event.findOne({ where: { status: 'active' } });

    if (event) {
      await event.update({
        name, starts_at, ends_at, venue, map_url, capacity,
        round_minutes, rounds_per_break, max_mentees_per_mentor, warn_seconds, tables_count,
        floor_plan, match_weights, landing_texts, status,
      });
    } else {
      event = await Event.create({
        name, starts_at, ends_at, venue, map_url, capacity,
        round_minutes, rounds_per_break, max_mentees_per_mentor, warn_seconds, tables_count,
        floor_plan, match_weights, landing_texts, status: status || 'active',
      });
    }

    await AuditLog.create({
      actor_id: req.userId,
      action: 'configure_event',
      entity: 'Event',
      entity_id: event.id,
    });

    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProgram = async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { status: 'active' },
      include: [
        { model: Session, as: 'sessions', include: [{ model: Speaker, as: 'speaker' }] },
      ],
    });
    if (!event) {
      return res.status(404).json({ message: 'No active event found' });
    }
    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listEvents = async (req, res) => {
  try {
    const events = await Event.findAll({ order: [['starts_at', 'DESC']] });
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const {
      name, starts_at, ends_at, venue, map_url, capacity,
      round_minutes, rounds_per_break, warn_seconds, tables_count,
      floor_plan, match_weights, landing_texts, status,
    } = req.body;

    const event = await Event.create({
      name, starts_at, ends_at, venue, map_url, capacity,
      round_minutes, rounds_per_break, warn_seconds, tables_count,
      floor_plan, match_weights, landing_texts, status: status || 'draft',
    });

    await AuditLog.create({
      actor_id: req.userId,
      action: 'create_event',
      entity: 'Event',
      entity_id: event.id,
    });

    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, starts_at, ends_at, venue, map_url, capacity,
      round_minutes, rounds_per_break, warn_seconds, tables_count,
      floor_plan, match_weights, landing_texts, status,
    } = req.body;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.update({
      name, starts_at, ends_at, venue, map_url, capacity,
      round_minutes, rounds_per_break, warn_seconds, tables_count,
      floor_plan, match_weights, landing_texts, status,
    });

    await AuditLog.create({
      actor_id: req.userId,
      action: 'update_event',
      entity: 'Event',
      entity_id: event.id,
    });

    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.destroy();

    await AuditLog.create({
      actor_id: req.userId,
      action: 'delete_event',
      entity: 'Event',
      entity_id: id,
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getEvent, configureEvent, getProgram,
  listEvents, createEvent, updateEvent, deleteEvent,
};
