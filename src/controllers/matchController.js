'use strict';
const { Match, Round, User, MenteeProfile, MentorProfile, Feedback, AuditLog } = require('../models');

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

module.exports = { getMyMatch, getMentorMatch, getAllMatches };
