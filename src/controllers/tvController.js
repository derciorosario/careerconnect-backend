'use strict';
const { Round, Match, User, Announcement } = require('../models');

const getTVData = async (req, res) => {
  try {
    const { code } = req.query;

    const currentRound = await Round.findOne({
      where: { status: 'running' },
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
      include: [{ model: Match, as: 'matches', include: [{ model: User, as: 'mentor', attributes: ['id', 'name'] }] }],
    });

    const announcements = await Announcement.findAll({
      order: [['sent_at', 'DESC']],
      limit: 5,
    });

    const matches = currentRound ? currentRound.matches : [];

    // Build a user lookup for mentee names directly from the User table so that
    // checked-in (present) mentees are resolved too, not only 'registered' ones.
    const menteeIds = [...new Set(
      matches.flatMap((m) => (Array.isArray(m.mentee_ids) ? m.mentee_ids : []))
    )];
    const userMap = {};
    if (menteeIds.length > 0) {
      const users = await User.findAll({
        where: { id: menteeIds },
        attributes: ['id', 'name'],
      });
      users.forEach((u) => { userMap[u.id] = u.name; });
    }

    const tableData = matches.map(m => {
      const menteeNames = (m.mentee_ids || []).map(id => userMap[id] || `Utilizador ${String(id).slice(0, 4)}`);
      return {
        table: m.table_no,
        mentor: m.mentor ? m.mentor.name : 'Livre',
        mentorId: m.mentor ? m.mentor.id : null,
        mentees: menteeNames,
        menteeCount: menteeNames.length,
      };
    });

    res.json({
      phase: currentRound ? `Intervalo ${currentRound.break_no} · Ronda ${currentRound.round_no} de 4` : 'Fora do intervalo',
      round: currentRound,
      tables: tableData,
      announcements,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTVData };
