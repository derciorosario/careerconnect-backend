'use strict';
const { Match, Round, User, MenteeProfile, MentorProfile, Registration, Event, Feedback, AuditLog } = require('../models');

const getMyMatch = async (req, res) => {
  try {
    const { round_id } = req.query;
    const userId = req.userId;

    let targetRoundId = round_id;
    if (!targetRoundId) {
      const runningRound = await Round.findOne({
        where: { status: 'running' },
        order: [['break_no', 'ASC'], ['round_no', 'ASC']],
      });
      if (runningRound) targetRoundId = runningRound.id;
    }

    const where = targetRoundId ? { round_id: targetRoundId } : {};
    const matches = await Match.findAll({
      where,
      include: [
        { model: Round, as: 'round' },
        { model: User, as: 'mentor', include: [{ model: MentorProfile, as: 'mentorProfile' }] },
      ],
    });

    const match = matches.find(m => m.mentee_ids && Array.isArray(m.mentee_ids) && m.mentee_ids.includes(userId));

    // Schedule across ALL rounds so the mentee can see every round's match
    // before the countdown starts.
    const allRoundMatches = await Match.findAll({
      include: [
        { model: Round, as: 'round' },
        { model: User, as: 'mentor', include: [{ model: MentorProfile, as: 'mentorProfile' }] },
      ],
      order: [[{ model: Round, as: 'round' }, 'break_no', 'ASC'], [{ model: Round, as: 'round' }, 'round_no', 'ASC']],
    });
    const mineAll = allRoundMatches.filter(
      m => Array.isArray(m.mentee_ids) && m.mentee_ids.includes(userId)
    );
    const allMatches = mineAll.map(m => ({
      id: m.id,
      round_id: m.round_id,
      round_no: m.round ? m.round.round_no : null,
      break_no: m.round ? m.round.break_no : null,
      table_no: m.table_no,
      mentor: m.mentor ? {
        id: m.mentor.id,
        name: m.mentor.name,
        photo_url: m.mentor.photo_url,
        profile: m.mentor.mentorProfile,
      } : null,
    }));

    if (!match) {
      return res.json({ match: null, allMatches, message: 'No match for this round' });
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
      allMatches,
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
      // Still return the full schedule so the mentor can plan ahead.
      const sched = await Match.findAll({
        where: { mentor_id: userId },
        include: [{ model: Round, as: 'round' }],
        order: [[{ model: Round, as: 'round' }, 'break_no', 'ASC'], [{ model: Round, as: 'round' }, 'round_no', 'ASC']],
      });
      const allMatches = sched.map(m => ({
        id: m.id,
        round_id: m.round_id,
        round_no: m.round ? m.round.round_no : null,
        break_no: m.round ? m.round.break_no : null,
        table_no: m.table_no,
        mentees: (m.mentee_ids || []).map((id) => ({ user_id: id })),
      }));
      return res.json({ match: null, allMatches, message: 'No match for this round' });
    }

    const menteeProfiles = await MenteeProfile.findAll({
      where: { user_id: match.mentee_ids },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'photo_url'] }],
    });

    // Schedule across ALL rounds for this mentor.
    const sched = await Match.findAll({
      where: { mentor_id: userId },
      include: [
        { model: Round, as: 'round' },
        { model: User, as: 'mentor' },
      ],
      order: [[{ model: Round, as: 'round' }, 'break_no', 'ASC'], [{ model: Round, as: 'round' }, 'round_no', 'ASC']],
    });
    const schedMenteeProfiles = await MenteeProfile.findAll({
      where: { user_id: sched.flatMap(m => m.mentee_ids || []) },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'photo_url'] }],
    });
    const allMatches = sched.map(m => ({
      id: m.id,
      round_id: m.round_id,
      round_no: m.round ? m.round.round_no : null,
      break_no: m.round ? m.round.break_no : null,
      table_no: m.table_no,
      mentees: (m.mentee_ids || []).map((id) => {
        const profile = schedMenteeProfiles.find(p => p.user_id === id);
        return {
          user_id: id,
          name: profile ? profile.user.name : '',
          photo_url: profile ? profile.user.photo_url : '',
          goal: profile ? profile.goal : '',
          pitch: profile ? profile.pitch : '',
          course: profile ? profile.course : '',
        };
      }),
    }));

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
      allMatches,
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
    const { Op } = require('sequelize');

    const event = await Event.findOne({
      where: { status: { [Op.notIn]: ['finished', 'closed'] } },
      order: [['starts_at', 'DESC']],
    });
    const event_id = event ? event.id : null;

    if (!event_id) {
      return res.status(400).json({ message: 'No active event found.' });
    }

    // Maximum number of mentees a mentor can be associated with per round.
    const maxMentees = Math.max(1, Number(event.max_mentees_per_mentor) || 3);

    // Generate the distribution for ALL existing rounds at once.
    const rounds = await Round.findAll({
      where: { event_id },
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
    });

    if (rounds.length === 0) {
      return res.status(400).json({ message: 'No rounds found. Create rounds first.' });
    }

    // Idempotent: wipe every match for these rounds before regenerating.
    const roundIds = rounds.map(r => r.id);
    await Match.destroy({ where: { round_id: roundIds } });

    // Only checked-in mentees (registration status "present") on active accounts.
    const menteeRegs = await Registration.findAll({
      where: { event_id, status: 'present' },
      include: [{
        model: User,
        as: 'user',
        where: { role: 'mentee', is_active: true },
        attributes: ['id', 'name', 'photo_url'],
        include: [{ model: MenteeProfile, as: 'menteeProfile', attributes: ['goal', 'course', 'institution', 'interests'] }],
      }],
    });
    const mentees = menteeRegs.map(r => r.user);

    // Only checked-in mentors (registration status "present") on active accounts.
    const mentorRegs = await Registration.findAll({
      where: { event_id, status: 'present' },
      include: [{
        model: User,
        as: 'user',
        where: { role: 'mentor', is_active: true },
        attributes: ['id', 'name', 'photo_url'],
        include: [{ model: MentorProfile, as: 'mentorProfile', attributes: ['job_title', 'company', 'sector', 'interests', 'max_mentees'] }],
      }],
    });
    const mentors = mentorRegs.map(r => r.user);

    if (mentors.length === 0) {
      return res.status(400).json({ message: 'No checked-in mentors available for matching.' });
    }
    if (mentees.length === 0) {
      return res.status(400).json({ message: 'No checked-in mentees available for matching.' });
    }

    const totalCapacity = mentors.length * maxMentees;
    if (mentees.length > totalCapacity) {
      return res.status(400).json({
        message: `Capacidade insuficiente: ${mentors.length} mentores x ${maxMentees} = ${totalCapacity} lugares para ${mentees.length} mentorandos. Aumenta o máximo de mentorandos por mentor.`,
      });
    }

    // Track mentor|mentee pairs already used so mentees rotate mentors across rounds.
    const usedPairs = new Set();
    const matches = [];

    for (let roundIdx = 0; roundIdx < rounds.length; roundIdx++) {
      const round = rounds[roundIdx];

      // mentorId -> array of assigned mentee ids for this round
      const assignment = new Map();
      mentors.forEach(m => assignment.set(m.id, []));

      // Shuffle mentees each round for variety.
      let remaining = [...mentees].sort(() => Math.random() - 0.5);

      // Rotate the mentor order each round so participation is fair (every
      // mentor gets a turn) and mentees tend to meet different mentors.
      const offset = mentors.length ? (roundIdx * maxMentees) % mentors.length : 0;
      const orderedMentors = [...mentors.slice(offset), ...mentors.slice(0, offset)];

      // Round-robin: give one mentee to each mentor per pass before anyone gets
      // a second. This guarantees EVERY mentor participates in the round
      // whenever there are at least as many mentees as mentors.
      for (let pass = 0; pass < maxMentees; pass++) {
        for (const mentor of orderedMentors) {
          if (remaining.length === 0) break;
          if (assignment.get(mentor.id).length >= maxMentees) continue;

          // Prefer a mentee this mentor has not met yet.
          let idx = remaining.findIndex(m => !usedPairs.has(`${mentor.id}|${m.id}`));
          if (idx === -1) idx = 0;
          const [mentee] = remaining.splice(idx, 1);
          assignment.get(mentor.id).push(mentee.id);
          usedPairs.add(`${mentor.id}|${mentee.id}`);
        }
        if (remaining.length === 0) break;
      }

      // One Match row per mentor that received at least one mentee.
      for (let i = 0; i < mentors.length; i++) {
        const mentor = mentors[i];
        const menteeIds = assignment.get(mentor.id);
        if (!menteeIds || menteeIds.length === 0) continue;

        // Simple compatibility score based on shared interests.
        const mentorProfile = mentor.mentorProfile;
        let bestScore = 60;
        for (const mId of menteeIds) {
          const m = mentees.find(x => x.id === mId);
          const mProf = m ? m.menteeProfile : null;
          let overlap = 0;
          if (mentorProfile && mProf && mentorProfile.interests && mProf.interests) {
            overlap = mentorProfile.interests.filter(x => mProf.interests.includes(x)).length;
          }
          const score = Math.min(95, 60 + overlap * 8 + Math.floor(Math.random() * 10));
          if (score > bestScore) bestScore = score;
        }

        const match = await Match.create({
          round_id: round.id,
          table_no: i + 1,
          mentor_id: mentor.id,
          mentee_ids: menteeIds,
          score: bestScore,
        });

        matches.push(match);
      }
    }

    // Warn (but still succeed) when there are more mentors than mentees, since
    // then some mentors cannot receive a mentee in a given round.
    const idleMentors = Math.max(0, mentors.length - mentees.length);

    await AuditLog.create({
      actor_id: organizerId,
      action: 'generate_matches',
      entity: 'Event',
      entity_id: event_id,
    });

    res.json({
      matches,
      rounds,
      mentors: mentors.length,
      mentees: mentees.length,
      idleMentors,
      message: idleMentors > 0
        ? `${idleMentors} mentor(es) sem mentorando por ronda (há mais mentores que mentorandos).`
        : 'Todos os mentores participam em todas as rondas.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyMatch, getMentorMatch, getAllMatches, generateMatches };
