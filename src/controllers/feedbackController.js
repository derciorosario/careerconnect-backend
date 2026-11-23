'use strict';
const { Feedback, Match, AuditLog } = require('../models');

const submitFeedback = async (req, res) => {
  try {
    const { match_id, to_user_id, wants_to_continue, usefulness, private_note } = req.body;
    const fromUserId = req.userId;

    const match = await Match.findByPk(match_id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const feedback = await Feedback.create({
      match_id,
      from_user_id: fromUserId,
      to_user_id,
      wants_to_continue,
      usefulness,
      private_note,
    });



    await AuditLog.create({
      actor_id: fromUserId,
      action: 'submit_feedback',
      entity: 'Feedback',
      entity_id: feedback.id,
    });

    // Check for mutual interest - create connection
    if (wants_to_continue) {

      const mutual = await Feedback.findOne({
        where: {
          match_id,
          from_user_id: to_user_id,
          to_user_id: fromUserId,
          wants_to_continue: true,
        },
      });

      console.log({mutual})

      if (mutual || true) {
        const { Connection } = require('../models');
        const [user_a, user_b] = [fromUserId, to_user_id].sort((a, b) => a - b);
        
        const existing = await Connection.findOne({ where: { user_a, user_b } });
       
        console.log({existing})


        if (!existing) {
          await Connection.create({ user_a, user_b, origin: 'mutual' });

          await AuditLog.create({
            actor_id: fromUserId,
            action: 'create_connection',
            entity: 'Connection',
            entity_id: user_a + '-' + user_b,
          });
        }
      }
    }

    res.status(201).json({ feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const userId = req.userId;
    const feedback = await Feedback.findAll({
      where: { from_user_id: userId },
      include: [{ model: Match, as: 'match' }],
    });
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitFeedback, getMyFeedback };
