'use strict';
const { Round, Match, User, MenteeProfile, MentorProfile, Announcement } = require('../models');

const getTVData = async (req, res) => {
  try {
    const { code } = req.query;
    
    const currentRound = await Round.findOne({
      where: { status: 'running' },
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
      include: [{ model: Match, as: 'matches' }],
    });

    const announcements = await Announcement.findAll({
      order: [['sent_at', 'DESC']],
      limit: 5,
    });

    const matches = currentRound ? currentRound.matches : [];

    const tableData = matches.map(m => ({
      table: m.table_no,
      mentor: m.mentor ? m.mentor.name : 'Livre',
      mentorId: m.mentor ? m.mentor.id : null,
    }));

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
