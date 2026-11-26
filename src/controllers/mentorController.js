'use strict';
const { User, MentorProfile, MenteeProfile, Wish, AuditLog, Event } = require('../models');
const { Op } = require('sequelize');

const getMentorDirectory = async (req, res) => {
  try {
    const { area } = req.query;
    // Organizers can see every mentor (including pending); others only approved ones.
    const approvalFilter = req.userRole === 'organizer' ? {} : { approval: 'approved' };
    const mentors = await User.findAll({
      where: { role: 'mentor' },
      include: [
        {
          model: MentorProfile,
          as: 'mentorProfile',
          where: { ...approvalFilter, ...(area ? { interests: { [Op.contains]: [area] } } : {}) },
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

const getMenteeDirectory = async (req, res) => {
  try {
    // Organizers can see every mentee (including pending); others only approved ones.
    const approvalFilter = req.userRole === 'organizer' ? {} : { approval: 'approved' };
    const mentees = await User.findAll({
      where: { role: 'mentee' },
      include: [
        { model: MenteeProfile, as: 'menteeProfile', where: approvalFilter, required: true },
      ],
      attributes: ['id', 'name', 'email', 'phone', 'photo_url', 'linkedin_url'],
      order: [['name', 'ASC']],
    });

    res.json({ mentees });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addWish = async (req, res) => {
  try {
    const { mentor_id } = req.body;
    const menteeId = req.userId;

    if (!mentor_id) {
      return res.status(400).json({ message: 'mentor_id is required' });
    }

    // Find the active event
    const event = await Event.findOne({ where: { status: 'active' } });
    if (!event) {
      return res.status(404).json({ message: 'No active event found' });
    }

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

    const wish = await Wish.create({ mentee_id: menteeId, mentor_id, event_id: event.id });

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
      include: [{
        model: User,
        as: 'mentor',
        attributes: ['id', 'name', 'photo_url'],
        include: [{ model: MentorProfile, as: 'mentorProfile', attributes: ['company', 'job_title', 'sector'] }],
      }],
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

const getWishesForMentor = async (req, res) => {
  try {
    const mentorId = req.userId;
    const wishes = await Wish.findAll({
      where: { mentor_id: mentorId },
      include: [{
        model: User,
        as: 'mentee',
        attributes: ['id', 'name', 'photo_url', 'email', 'phone'],
        include: [{ model: MenteeProfile, as: 'menteeProfile', attributes: ['goal', 'course', 'institution'] }],
      }],
      order: [['created_at', 'DESC']],
    });
    res.json({ wishes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeWish = async (req, res) => {
  try {
    const { mentor_id } = req.body;
    const menteeId = req.userId;

    if (!mentor_id) {
      return res.status(400).json({ message: 'mentor_id is required' });
    }

    const deleted = await Wish.destroy({ where: { mentee_id: menteeId, mentor_id } });
    res.json({ message: 'Wish removed', removed: deleted > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMentorDirectory, getMenteeDirectory, addWish, getMyWishes, getWishCount, removeWish, getWishesForMentor };
