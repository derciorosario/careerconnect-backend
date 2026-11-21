'use strict';
const { User, MentorProfile, Wish, AuditLog } = require('../models');
const { Op } = require('sequelize');

const getMentorDirectory = async (req, res) => {
  try {
    const { area } = req.query;
    const where = { approval: 'approved' };
    
    const mentors = await User.findAll({
      where: { role: 'mentor' },
      include: [
        {
          model: MentorProfile,
          as: 'mentorProfile',
          where: area ? { interests: { [Op.contains]: [area] } } : {},
          required: true,
        },
      ],
      attributes: ['id', 'name', 'email', 'phone', 'photo_url', 'linkedin_url'],
    });

    res.json({ mentors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addWish = async (req, res) => {
  try {
    const { mentor_id, event_id } = req.body;
    const menteeId = req.userId;

    // Check max 5 wishes
    const count = await Wish.count({ where: { mentee_id: menteeId } });
    if (count >= 5) {
      return res.status(400).json({ message: 'Maximum 5 wishes allowed' });
    }

    // Check if already exists
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
      include: [{ model: User, as: 'mentor', attributes: ['id', 'name', 'photo_url', 'company'] }],
    });
    res.json({ wishes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getWishCount = async (req, res) => {
  try {
    const { mentor_id } = req.query;
    const count = await Wish.count({ where: { mentor_id } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMentorDirectory, addWish, getMyWishes, getWishCount };
