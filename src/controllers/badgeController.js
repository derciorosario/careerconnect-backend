'use strict';
const { Badge, User } = require('../models');

const getBadges = async (req, res) => {
  try {
    const { user_id } = req.query;
    const where = user_id ? { user_id } : {};
    
    const badges = await Badge.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'photo_url'] }],
      order: [['earned_at', 'DESC']],
    });
    res.json({ badges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const awardBadge = async (req, res) => {
  try {
    const { user_id, code } = req.body;
    const organizerId = req.userId;

    const badge = await Badge.create({ user_id, code, earned_at: new Date() });

    res.status(201).json({ badge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getBadges, awardBadge };
