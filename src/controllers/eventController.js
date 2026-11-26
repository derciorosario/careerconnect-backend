'use strict';
const { Op } = require('sequelize');
const { Event, Session, Speaker, AuditLog, Registration, Wish, Round, Announcement, SurveyResponse } = require('../models');

// Returns the active event other than `excludeId` (if any). Used to guarantee
// that only one event can be active at a time.
const findOtherActiveEvent = async (excludeId) => {
  const where = { status: 'active' };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Event.findOne({ where });
};

// Returns a list of association names that still reference the event. An event
// that has been used (sessions, registrations, wishes, rounds, announcements,
// survey responses) cannot be deleted to preserve data integrity.
const findEventUsages = async (eventId) => {
  const checks = [
    ['sessões', Session.count({ where: { event_id: eventId } })],
    ['inscrições', Registration.count({ where: { event_id: eventId } })],
    ['desejos', Wish.count({ where: { event_id: eventId } })],
    ['rondas', Round.count({ where: { event_id: eventId } })],
    ['anúncios', Announcement.count({ where: { event_id: eventId } })],
    ['respostas de questionário', SurveyResponse.count({ where: { event_id: eventId } })],
  ];
  const results = await Promise.all(checks.map(([, promise]) => promise));
  return checks.filter(([, promise], i) => results[i] > 0).map(([label]) => label);
};

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

    // Only one event may be active at a time.
    if (status === 'active' && await findOtherActiveEvent(event ? event.id : null)) {
      return res.status(409).json({ message: 'Já existe um evento activo. Desactive-o antes de activar outro.' });
    }

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

    // Only one event may be active at a time.
    if (status === 'active' && await findOtherActiveEvent(null)) {
      return res.status(409).json({ message: 'Já existe um evento activo. Desactive-o antes de activar outro.' });
    }

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

    // Only one event may be active at a time.
    if (status === 'active' && await findOtherActiveEvent(event.id)) {
      return res.status(409).json({ message: 'Já existe um evento activo. Desactive-o antes de activar outro.' });
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

    // Do not allow deleting an event that is still referenced by its associations.
    const usages = await findEventUsages(event.id);
    if (usages.length > 0) {
      return res.status(409).json({
        message: `Não é possível eliminar o evento: está associado a ${usages.join(', ')}.`,
      });
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
