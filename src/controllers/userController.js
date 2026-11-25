'use strict';
const { User, MenteeProfile, MentorProfile, Registration, Event, Feedback, Connection, MentorshipRequest, SurveyResponse, NextStep, Badge, AuditLog, Match, Round } = require('../models');

const { Op } = require('sequelize');

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [
        { model: MenteeProfile, as: 'menteeProfile' },
        { model: MentorProfile, as: 'mentorProfile' },
        { model: Registration, as: 'registrations', include: [{ model: Event, as: 'event' }] },
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
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (req.file) user.photo_url = `/uploads/${req.file.filename}`;
    else if (photo_url !== undefined) user.photo_url = photo_url;
    if (linkedin_url !== undefined) user.linkedin_url = linkedin_url;
    await user.save();

    // Update role-specific profile (partial update — never reset approval/limits)
    let menteeProfile = req.body.menteeProfile;
    let mentorProfile = req.body.mentorProfile;
    if (typeof menteeProfile === 'string') { try { menteeProfile = JSON.parse(menteeProfile); } catch {} }
    if (typeof mentorProfile === 'string') { try { mentorProfile = JSON.parse(mentorProfile); } catch {} }

    if (user.role === 'mentee' && menteeProfile) {
      const [mp] = await MenteeProfile.findOrCreate({
        where: { user_id: user.id },
        defaults: { user_id: user.id, ...menteeProfile },
      });
      if (mp) {
        const { user_id, ...fields } = menteeProfile;
        await mp.update(fields);
      }
    } else if (user.role === 'mentor' && mentorProfile) {
      const [mp] = await MentorProfile.findOrCreate({
        where: { user_id: user.id },
        defaults: { user_id: user.id, ...mentorProfile },
      });
      if (mp) {
        const { user_id, ...fields } = mentorProfile;
        await mp.update(fields);
      }
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
