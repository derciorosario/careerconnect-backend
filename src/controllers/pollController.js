'use strict';
const { Poll, PollVote, AuditLog } = require('../models');

const getPolls = async (req, res) => {
  try {
    const { session_id } = req.query;
    const where = session_id ? { session_id } : {};
    
    const polls = await Poll.findAll({ where, order: [['created_at', 'DESC']] });
    res.json({ polls });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createPoll = async (req, res) => {
  try {
    const { session_id, question, options } = req.body;
    const organizerId = req.userId;

    const poll = await Poll.create({
      session_id,
      question,
      options,
    });

    await AuditLog.create({
      actor_id: organizerId,
      action: 'create_poll',
      entity: 'Poll',
      entity_id: poll.id,
    });

    res.status(201).json({ poll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const votePoll = async (req, res) => {
  try {
    const { poll_id, option_index } = req.body;
    const userId = req.userId;

    const existing = await PollVote.findOne({ where: { poll_id, user_id: userId } });
    if (existing) {
      return res.status(400).json({ message: 'Already voted' });
    }

    await PollVote.create({ poll_id, user_id: userId, option_index });

    res.json({ message: 'Vote recorded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPollResults = async (req, res) => {
  try {
    const { poll_id } = req.query;
    const votes = await PollVote.findAll({ where: { poll_id } });
    
    const poll = await Poll.findByPk(poll_id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const results = poll.options.map((option, index) => ({
      option,
      index,
      votes: votes.filter(v => v.option_index === index).length,
    }));

    res.json({ poll, results, totalVotes: votes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPolls, createPoll, votePoll, getPollResults };
