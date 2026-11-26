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

// Mark any running round whose countdown (ends_at) has elapsed as 'done'.
// Only 'running' rounds are affected, so paused/terminated (planned) rounds are
// never auto-finalised. Returns the rounds that were finalised.
const finalizeExpiredRounds = async (eventId) => {
  const now = new Date();
  const where = { status: 'running', ends_at: { [Op.lte]: now } };
  if (eventId) where.event_id = eventId;
  const expired = await Round.findAll({ where });
  for (const round of expired) {
    round.status = 'done';
    round.ends_at = now;
    await round.save();
  }
  return expired;
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

    // Stop after finalising the current round without starting the next one.
    // Used to end a break and wait for the organizer to explicitly start the next.
    if (req.body && req.body.stop) {
      await AuditLog.create({
        actor_id: organizerId,
        action: 'end_break',
        entity: 'Round',
        entity_id: current ? current.id : event_id,
      });
      return res.json({ round: current, stopped: true });
    }

    // Find next planned round
    const nextRound = await Round.findOne({
      where: { event_id, status: 'planned' },
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
    });

    if (nextRound) {
      nextRound.status = 'running';
      nextRound.started_at = new Date();
      const event = await Event.findByPk(event_id);
      const durationMinutes = event ? event.round_minutes : 5;
      nextRound.ends_at = new Date(Date.now() + durationMinutes * 60 * 1000);
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
    if (round.paused_remaining != null) {
      round.ends_at = new Date(Date.now() + round.paused_remaining);
    }
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
    // Auto-finalise any round whose countdown has elapsed (server-side timer).
    await finalizeExpiredRounds(event_id);
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

// Explicit countdown tick: finalises expired rounds and returns the current one.
// Organizer clients can call this to drive the server-side timer.
const tickRounds = async (req, res) => {
  try {
    const event_id = await resolveEventId(req.body?.event_id || req.query.event_id);
    const finalized = await finalizeExpiredRounds(event_id);
    const where = event_id ? { event_id, status: 'running' } : { status: 'running' };
    const round = await Round.findOne({
      where,
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
    });
    res.json({ round, finalized: finalized.map((r) => r.id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resetRounds = async (req, res) => {
  try {
    const organizerId = req.userId;
    const event_id = await resolveEventId(req.body.event_id);

    if (!event_id) {
      return res.status(400).json({ message: 'No active event found.' });
    }

    // Reset all rounds to planned
    await Round.update(
      { status: 'planned', started_at: null, ends_at: null, paused_remaining: null },
      { where: { event_id } }
    );

    // Clear all matches for this event's rounds
    const rounds = await Round.findAll({ where: { event_id } });
    const roundIds = rounds.map((r) => r.id);
    if (roundIds.length > 0) {
      await Match.destroy({ where: { round_id: roundIds } });
    }

    await AuditLog.create({
      actor_id: organizerId,
      action: 'reset_rounds',
      entity: 'Round',
      entity_id: event_id,
    });

    res.json({ message: 'Rounds reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createRound = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { event_id, break_no, round_no, duration_minutes } = req.body;

    const eventId = await resolveEventId(event_id);
    if (!eventId) {
      return res.status(400).json({ message: 'No active event found.' });
    }

    const round = await Round.create({
      event_id: eventId,
      break_no: break_no || 1,
      round_no: round_no || 1,
      status: 'planned',
    });

    await AuditLog.create({
      actor_id: organizerId,
      action: 'create_round',
      entity: 'Round',
      entity_id: round.id,
    });

    res.status(201).json({ round });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRound = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { id } = req.params;
    const { break_no, round_no, status, duration_minutes } = req.body;

    const round = await Round.findByPk(id);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    if (break_no !== undefined) round.break_no = break_no;
    if (round_no !== undefined) round.round_no = round_no;
    if (status !== undefined) round.status = status;

    await round.save();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'update_round',
      entity: 'Round',
      entity_id: round.id,
    });

    res.json({ round });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRound = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { id } = req.params;

    const round = await Round.findByPk(id);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    // Delete associated matches first
    await Match.destroy({ where: { round_id: id } });

    await round.destroy();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'delete_round',
      entity: 'Round',
      entity_id: id,
    });

    res.json({ message: 'Round deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRounds, advanceRound, pauseRound, resumeRound, getCurrentRound, tickRounds, resetRounds, createRound, updateRound, deleteRound };
