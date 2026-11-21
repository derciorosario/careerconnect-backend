'use strict';
const { Wish, Feedback, AuditLog } = require('../models');

const addWish = async (req, res) => {
  try {
    const { mentor_id, event_id } = req.body;
    const menteeId = req.userId;

    const count = await Wish.count({ where: { mentee_id: menteeId } });
    if (count >= 5) {
      return res.status(400).json({ message: 'Maximum 5 wishes allowed' });
    }

    const existing = await Wish.findOne({ where: { mentee_id: menteeId, mentor_id } });
    if (existing) {
      return res.status(400).json({ message: 'Already marked this mentor' });
    }

    const wish = await Wish.create({ mentee_id: menteeId, mentor_id, event_id });

    await AuditLog.create({
      actor_id: menteeId,
      action: 'add_wish',
      entity: 'Wish',
      entity_id: wish.id,
    });

    res.status(201).json({ wish });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyWishes = async (req, res) => {
  try {
    const menteeId = req.userId;
    const wishes = await Wish.findAll({
      where: { mentee_id: menteeId },
      include: [{ model: Wish.sequelize.models.User, as: 'mentor', attributes: ['id', 'name', 'photo_url'] }],
    });
    res.json({ wishes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addWish, getMyWishes };
