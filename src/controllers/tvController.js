'use strict';
const { Round, Match, User, MentorProfile, Announcement, Registration } = require('../models');

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

    // Build a user lookup for mentee names
    const regs = await Registration.findAll({
      where: { status: 'registered' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name'],
      }],
    });
    const userMap = {};
    regs.forEach(r => { userMap[r.user.id] = r.user.name; });

    const matches = currentRound ? currentRound.matches : [];

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
