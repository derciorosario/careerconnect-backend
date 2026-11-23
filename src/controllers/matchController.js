'use strict';
const { Match, Round, User, MenteeProfile, MentorProfile, Registration, Event, Feedback, AuditLog } = require('../models');

const getMyMatch = async (req, res) => {
  try {
    const { round_id } = req.query;
    const userId = req.userId;

    const where = round_id ? { round_id } : {};
    const matches = await Match.findAll({
      where,
      include: [
        { model: Round, as: 'round' },
        { model: User, as: 'mentor', include: [{ model: MentorProfile, as: 'mentorProfile' }] },
      ],
    });

    const match = matches.find(m => m.mentee_ids && m.mentee_ids.includes(userId));

    if (!match) {
      return res.json({ match: null, message: 'No match for this round' });
    }

    const mentor = match.mentor;
    const menteeProfiles = await MenteeProfile.findAll({
      where: { user_id: match.mentee_ids },
    });

    res.json({
      match: {
        id: match.id,
        table_no: match.table_no,
        score: match.score,
        mentor: {
          id: mentor.id,
          name: mentor.name,
          photo_url: mentor.photo_url,
          profile: mentor.mentorProfile,
        },
        mentees: match.mentee_ids.map((id, idx) => ({
          user_id: id,
          profile: menteeProfiles.find(p => p.user_id === id),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMentorMatch = async (req, res) => {
  try {
    const { round_id } = req.query;
    const userId = req.userId;

    // If no round_id, find the currently running round
    let targetRoundId = round_id;
    if (!targetRoundId) {
      const runningRound = await Round.findOne({
        where: { status: 'running' },
        order: [['break_no', 'ASC'], ['round_no', 'ASC']],
      });
      if (runningRound) targetRoundId = runningRound.id;
    }

    const where = targetRoundId ? { round_id: targetRoundId, mentor_id: userId } : { mentor_id: userId };
    const match = await Match.findOne({
      where,
      include: [
        { model: Round, as: 'round' },
        { model: User, as: 'mentor' },
      ],
    });

    if (!match) {
      return res.json({ match: null, message: 'No match for this round' });
    }

    const menteeProfiles = await MenteeProfile.findAll({
      where: { user_id: match.mentee_ids },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'photo_url'] }],
    });

    res.json({
      match: {
        id: match.id,
        table_no: match.table_no,
        score: match.score,
        round_id: match.round_id,
        mentees: match.mentee_ids.map((id) => {
          const profile = menteeProfiles.find(p => p.user_id === id);
          return {
            user_id: id,
            name: profile ? profile.user.name : '',
            photo_url: profile ? profile.user.photo_url : '',
            goal: profile ? profile.goal : '',
            pitch: profile ? profile.pitch : '',
            course: profile ? profile.course : '',
          };
        }),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllMatches = async (req, res) => {
  try {
    const { round_id } = req.query;
    const where = round_id ? { round_id } : {};
    const matches = await Match.findAll({
      where,
      include: [
        { model: Round, as: 'round' },
        { model: User, as: 'mentor', include: [{ model: MentorProfile, as: 'mentorProfile' }] },
      ],
    });
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const generateMatches = async (req, res) => {
  try {
    const organizerId = req.userId;

    const active = await Event.findOne({
      where: { status: { [require('sequelize').Op.notIn]: ['finished', 'closed'] } },
      order: [['starts_at', 'DESC']],
    });
    const event_id = active ? active.id : null;

    if (!event_id) {
      return res.status(400).json({ message: 'No active event found.' });
    }

    const round = await Round.findOne({
      where: { event_id, status: 'running' },
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
    });

    if (!round) {
      return res.status(400).json({ message: 'No running round found. Start a round first.' });
    }

    // Idempotent: remove existing matches for this round
    await Match.destroy({ where: { round_id: round.id } });

    // Registered mentees
    const menteeRegs = await Registration.findAll({
      where: { event_id, status: 'registered' },
      include: [{
        model: User,
        as: 'user',
        where: { role: 'mentee' },
        attributes: ['id', 'name', 'photo_url'],
        include: [{ model: MenteeProfile, as: 'menteeProfile', attributes: ['goal', 'course', 'institution', 'interests'] }],
      }],
    });
    const mentees = menteeRegs.map(r => r.user);

    // Registered approved mentors
    const mentorRegs = await Registration.findAll({
      where: { event_id, status: 'registered' },
      include: [{
        model: User,
        as: 'user',
        where: { role: 'mentor' },
        attributes: ['id', 'name', 'photo_url'],
        include: [{ model: MentorProfile, as: 'mentorProfile', where: { approval: 'approved' }, attributes: ['job_title', 'company', 'sector', 'interests', 'max_mentees'] }],
      }],
    });
    const mentors = mentorRegs.map(r => r.user);

    if (mentors.length === 0) {
      return res.status(400).json({ message: 'No approved mentors available for matching.' });
    }
    if (mentees.length === 0) {
      return res.status(400).json({ message: 'No mentees available for matching.' });
    }

    // ── Avoid repeating pairs from previous done rounds ─────────────────
    const previousRounds = await Round.findAll({
      where: { event_id, status: 'done' },
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
    });
    const previousRoundIds = previousRounds.map(r => r.id);
    const previousMatches = previousRoundIds.length > 0
      ? await Match.findAll({ where: { round_id: previousRoundIds } })
      : [];
    const usedPairs = new Set();
    previousMatches.forEach(m => {
      if (m.mentee_ids && Array.isArray(m.mentee_ids)) {
        m.mentee_ids.forEach(menteeId => {
          usedPairs.add(`${m.mentor_id}|${menteeId}`);
        });
      }
    });

    // Even distribution: every mentee gets a mentor, no mentor left with zero if possible
    const base = Math.floor(mentees.length / mentors.length);
    const remainder = mentees.length % mentors.length;
    const matches = [];
    let menteeIndex = 0;

    for (let i = 0; i < mentors.length; i++) {
      const mentor = mentors[i];
      const tableNo = i + 1;
      const menteeCount = i < remainder ? base + 1 : base;
      const menteeIds = [];

      // Try to assign mentees not yet paired with this mentor
      const preferred = [];
      const fallback = [];
      for (let j = menteeIndex; j < mentees.length; j++) {
        const m = mentees[j];
        const pairKey = `${mentor.id}|${m.id}`;
        if (usedPairs.has(pairKey)) fallback.push(m);
        else preferred.push(m);
      }

      // Pick from preferred first, then fallback
      let picked = [];
      const needed = menteeCount;
      for (let k = 0; k < needed && preferred.length > 0; k++) {
        picked.push(preferred.shift());
        menteeIndex++;
      }
      for (let k = picked.length; k < needed && fallback.length > 0; k++) {
        picked.push(fallback.shift());
        menteeIndex++;
      }
      // If still needed, take any remaining mentees in order
      for (let k = picked.length; k < needed && menteeIndex < mentees.length; k++) {
        picked.push(mentees[menteeIndex]);
        menteeIndex++;
      }

      for (const m of picked) {
        menteeIds.push(m.id);
      }

      // Simple compatibility score based on shared interests
      const mentorProfile = mentor.mentorProfile;
      let bestScore = 60;
      for (const mId of menteeIds) {
        const m = mentees.find(x => x.id === mId);
        const mProf = m.menteeProfile;
        let overlap = 0;
        if (mentorProfile && mProf && mentorProfile.interests && mProf.interests) {
          overlap = mentorProfile.interests.filter(x => mProf.interests.includes(x)).length;
        }
        const score = Math.min(95, 60 + overlap * 8 + Math.floor(Math.random() * 10));
        if (score > bestScore) bestScore = score;
      }

      const match = await Match.create({
        round_id: round.id,
        table_no: tableNo,
        mentor_id: mentor.id,
        mentee_ids: menteeIds,
        score: bestScore,
      });

      matches.push(match);
    }

    // If any mentees were left (shouldn't happen), attach to first mentor
    if (menteeIndex < mentees.length) {
      const leftovers = mentees.slice(menteeIndex).map(m => m.id);
      const first = matches[0];
      if (first) {
        first.mentee_ids = [...first.mentee_ids, ...leftovers];
        await first.save();
      }
    }

    await AuditLog.create({
      actor_id: organizerId,
      action: 'generate_matches',
      entity: 'Match',
      entity_id: round.id,
    });

    res.json({ matches, round });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyMatch, getMentorMatch, getAllMatches, generateMatches };
