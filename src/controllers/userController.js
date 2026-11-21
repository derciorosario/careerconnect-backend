'use strict';
const { User, MenteeProfile, MentorProfile, Registration, Event, Feedback, Connection, MentorshipRequest, SurveyResponse, NextStep, Badge, AuditLog, Match, Round } = require('../models');

const { Op } = require('sequelize');

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [
        { model: MenteeProfile, as: 'menteeProfile' },
        { model: MentorProfile, as: 'mentorProfile' },
      ],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, photo_url, linkedin_url } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (photo_url !== undefined) user.photo_url = photo_url;
    if (linkedin_url !== undefined) user.linkedin_url = linkedin_url;
    await user.save();

    // Update role-specific profile
    if (user.role === 'mentee' && req.body.menteeProfile) {
      await MenteeProfile.upsert({
        user_id: user.id,
        ...req.body.menteeProfile,
      });
    } else if (user.role === 'mentor' && req.body.mentorProfile) {
      await MentorProfile.upsert({
        user_id: user.id,
        ...req.body.mentorProfile,
      });
    }

    const updated = await User.findByPk(user.id, {
      include: [
        { model: MenteeProfile, as: 'menteeProfile' },
        { model: MentorProfile, as: 'mentorProfile' },
      ],
    });

    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const where = role ? { role } : {};
    const users = await User.findAll({ where, include: [
      { model: MenteeProfile, as: 'menteeProfile' },
      { model: MentorProfile, as: 'mentorProfile' },
    ] });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMenteeDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    const [registrations, connections, requests, survey, nextSteps, badges] = await Promise.all([
      Registration.findAll({ where: { user_id: userId }, include: [{ model: Event, as: 'event' }] }),
      Connection.findAll({
        where: { [Op.or]: [{ user_a: userId }, { user_b: userId }] },
        include: [
          { model: User, as: 'userA', attributes: ['id', 'name', 'photo_url', 'role'] },
          { model: User, as: 'userB', attributes: ['id', 'name', 'photo_url', 'role'] },
        ],
      }),
      MentorshipRequest.findAll({ where: { mentee_id: userId } }),
      SurveyResponse.findOne({ where: { user_id: userId } }),
      NextStep.findOne({ where: { user_id: userId } }),
      Badge.findAll({ where: { user_id: userId } }),
    ]);

    res.json({
      registrations,
      connections,
      mentorshipRequests: requests,
      survey,
      nextStep: nextSteps,
      badges,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMentorDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    const [mentorProfile, requests, connections] = await Promise.all([
      MentorProfile.findOne({ where: { user_id: userId } }),
      MentorshipRequest.findAll({ where: { mentor_id: userId } }),
      Connection.findAll({
        where: { [Op.or]: [{ user_a: userId }, { user_b: userId }] },
        include: [
          { model: User, as: 'userA', attributes: ['id', 'name', 'photo_url', 'role'] },
          { model: User, as: 'userB', attributes: ['id', 'name', 'photo_url', 'role'] },
        ],
      }),
    ]);

    res.json({
      mentorProfile,
      mentorshipRequests: requests,
      connections,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, updateProfile, getAllUsers, getMenteeDashboard, getMentorDashboard };
