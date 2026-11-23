'use strict';
const { Round, Match, Registration, User, MentorProfile, AuditLog, Event } = require('../models');
const { Op } = require('sequelize');

// Resolve the active event when event_id is not explicitly provided.
const resolveEventId = async (explicit) => {
  if (explicit) return explicit;
  const active = await Event.findOne({
    where: { status: { [Op.notIn]: ['finished', 'closed'] } },
    order: [['starts_at', 'DESC']],
  });
  return active ? active.id : null;
};

const getRounds = async (req, res) => {
  try {
    const { event_id } = req.query;
    const where = event_id ? { event_id } : {};
    const rounds = await Round.findAll({ where, order: [['break_no', 'ASC'], ['round_no', 'ASC']] });
    res.json({ rounds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const advanceRound = async (req, res) => {
  try {
    const organizerId = req.userId;
    const event_id = await resolveEventId(req.body.event_id);

    if (!event_id) {
      return res.status(400).json({ message: 'No active event found.' });
    }

    const current = await Round.findOne({
      where: { event_id, status: 'running' },
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
    });

    if (current) {
      current.status = 'done';
      current.ends_at = new Date();
      await current.save();
    }

    // Find next planned round
    const nextRound = await Round.findOne({
      where: { event_id, status: 'planned' },
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
    });

    if (nextRound) {
      nextRound.status = 'running';
      nextRound.started_at = new Date();
      await nextRound.save();

      await AuditLog.create({
        actor_id: organizerId,
        action: 'advance_round',
        entity: 'Round',
        entity_id: nextRound.id,
      });

      res.json({ round: nextRound });
    } else {
      res.json({ message: 'No more rounds', current });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const pauseRound = async (req, res) => {
  try {
    const organizerId = req.userId;

    let round;
    if (req.body.round_id) {
      round = await Round.findByPk(req.body.round_id);
    } else {
      const event_id = await resolveEventId(req.body.event_id);
      if (!event_id) {
        return res.status(400).json({ message: 'No active event found.' });
      }
      round = await Round.findOne({
        where: { event_id, status: 'running' },
        order: [['break_no', 'ASC'], ['round_no', 'ASC']],
      });
    }

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    round.status = 'paused';
    round.paused_remaining = Math.max(0, (round.ends_at || Date.now()) - Date.now());
    await round.save();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'pause_round',
      entity: 'Round',
      entity_id: round.id,
    });

    res.json({ round });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resumeRound = async (req, res) => {
  try {
    const organizerId = req.userId;

    let round;
    if (req.body.round_id) {
      round = await Round.findByPk(req.body.round_id);
    } else {
      const event_id = await resolveEventId(req.body.event_id);
      if (!event_id) {
        return res.status(400).json({ message: 'No active event found.' });
      }
      round = await Round.findOne({
        where: { event_id, status: 'paused' },
        order: [['break_no', 'ASC'], ['round_no', 'ASC']],
      });
    }

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    round.status = 'running';
    round.paused_remaining = null;
    await round.save();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'resume_round',
      entity: 'Round',
      entity_id: round.id,
    });

    res.json({ round });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCurrentRound = async (req, res) => {
  try {
    const event_id = await resolveEventId(req.query.event_id);
    const where = event_id ? { event_id, status: 'running' } : { status: 'running' };
    const round = await Round.findOne({
      where,
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
    });
    res.json({ round });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRounds, advanceRound, pauseRound, resumeRound, getCurrentRound };
