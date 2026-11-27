'use strict';
const {
  User, MenteeProfile, MentorProfile, Registration, Event, Feedback, Connection,
  MentorshipRequest, SurveyResponse, NextStep, Badge, AuditLog, Match, Round,
  Speaker, Session, Wish, Booking, Message, Question, QuestionVote, Poll, PollVote,
  Announcement, Notification,
} = require('../models');
const { sequelize } = require('../config/db');
const { normalizeLevel } = require('../utils/registrationDefaults');

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
    if (req.body.notify_email !== undefined) {
      user.notify_email = req.body.notify_email === true || req.body.notify_email === 'true';
    }
    if (req.body.notify_whatsapp !== undefined) {
      user.notify_whatsapp = req.body.notify_whatsapp === true || req.body.notify_whatsapp === 'true';
    }
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
        if (fields.level !== undefined) fields.level = normalizeLevel(fields.level);
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

const updateUserByOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, linkedin_url, menteeProfile, mentorProfile } = req.body;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (linkedin_url !== undefined) user.linkedin_url = linkedin_url;
    if (req.file) user.photo_url = `/uploads/${req.file.filename}`;
    else if (req.body.photo_url !== undefined && req.body.photo_url !== '') user.photo_url = req.body.photo_url;
    await user.save();

    let mp = menteeProfile;
    let mtp = mentorProfile;
    if (typeof mp === 'string') { try { mp = JSON.parse(mp); } catch {} }
    if (typeof mtp === 'string') { try { mtp = JSON.parse(mtp); } catch {} }

    if (user.role === 'mentee' && mp) {
      const [profile] = await MenteeProfile.findOrCreate({ where: { user_id: user.id }, defaults: { user_id: user.id, ...mp } });
      const { user_id, ...fields } = mp;
      if (fields.level !== undefined) fields.level = normalizeLevel(fields.level);
      await profile.update(fields);
    } else if (user.role === 'mentor' && mtp) {
      const [profile] = await MentorProfile.findOrCreate({ where: { user_id: user.id }, defaults: { user_id: user.id, ...mtp } });
      const { user_id, ...fields } = mtp;
      await profile.update(fields);
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

// Enable / disable a user. Disabled users cannot log in or participate in rounds.
const setUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'organizer') {
      return res.status(400).json({ message: 'Não é possível desactivar um organizador.' });
    }
    const { is_active } = req.body;
    user.is_active = is_active === true || is_active === 'true';
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a user and everything created with/for them (cascade across models).
const deleteUserByOrganizer = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'organizer') {
      await t.rollback();
      return res.status(400).json({ message: 'Não é possível eliminar um organizador.' });
    }
    if (id === req.userId) {
      await t.rollback();
      return res.status(400).json({ message: 'Não podes eliminar a tua própria conta.' });
    }

    // ── Matches: delete those mentored by the user; detach the user from
    //    mentee_ids of other matches (deleting any that become empty).
    const allMatches = await Match.findAll({ transaction: t });
    const matchIdsToDelete = [];
    for (const m of allMatches) {
      if (m.mentor_id === id) {
        matchIdsToDelete.push(m.id);
        continue;
      }
      const ids = Array.isArray(m.mentee_ids) ? m.mentee_ids : [];
      if (ids.includes(id)) {
        const remaining = ids.filter((x) => x !== id);
        if (remaining.length === 0) matchIdsToDelete.push(m.id);
        else await m.update({ mentee_ids: remaining }, { transaction: t });
      }
    }

    // ── Feedback (by the user, about the user, or on deleted matches)
    const feedbackWhere = { [Op.or]: [{ from_user_id: id }, { to_user_id: id }] };
    if (matchIdsToDelete.length) feedbackWhere[Op.or].push({ match_id: matchIdsToDelete });
    await Feedback.destroy({ where: feedbackWhere, transaction: t });

    if (matchIdsToDelete.length) {
      await Match.destroy({ where: { id: matchIdsToDelete }, transaction: t });
    }

    // ── Connections + their messages
    const conns = await Connection.findAll({
      where: { [Op.or]: [{ user_a: id }, { user_b: id }] },
      transaction: t,
    });
    const connIds = conns.map((c) => c.id);
    if (connIds.length) {
      await Message.destroy({ where: { connection_id: connIds }, transaction: t });
      await Connection.destroy({ where: { id: connIds }, transaction: t });
    }
    await Message.destroy({ where: { from_user_id: id }, transaction: t });

    // ── Everything else that references the user
    await MentorshipRequest.destroy({ where: { [Op.or]: [{ mentee_id: id }, { mentor_id: id }] }, transaction: t });
    await QuestionVote.destroy({ where: { user_id: id }, transaction: t });
    await PollVote.destroy({ where: { user_id: id }, transaction: t });
    await Question.destroy({ where: { [Op.or]: [{ user_id: id }, { mentor_id: id }] }, transaction: t });
    await Booking.destroy({ where: { user_id: id }, transaction: t });
    await Wish.destroy({ where: { [Op.or]: [{ mentee_id: id }, { mentor_id: id }] }, transaction: t });
    await Registration.destroy({ where: { user_id: id }, transaction: t });
    await Notification.destroy({ where: { user_id: id }, transaction: t });
    await SurveyResponse.destroy({ where: { user_id: id }, transaction: t });
    await NextStep.destroy({ where: { user_id: id }, transaction: t });
    await Badge.destroy({ where: { user_id: id }, transaction: t });
    await AuditLog.destroy({ where: { actor_id: id }, transaction: t });
    await Announcement.destroy({ where: { sent_by: id }, transaction: t });

    // ── Sessions / speakers: detach (keep event content intact)
    await Session.update({ mentor_id: null }, { where: { mentor_id: id }, transaction: t });
    const speakers = await Speaker.findAll({ where: { user_id: id }, transaction: t });
    const speakerIds = speakers.map((s) => s.id);
    if (speakerIds.length) {
      await Session.update({ speaker_id: null }, { where: { speaker_id: speakerIds }, transaction: t });
      await Speaker.destroy({ where: { id: speakerIds }, transaction: t });
    }

    // ── Profiles then the user
    await MenteeProfile.destroy({ where: { user_id: id }, transaction: t });
    await MentorProfile.destroy({ where: { user_id: id }, transaction: t });
    await user.destroy({ transaction: t });

    await t.commit();
    res.json({ message: 'Utilizador eliminado com sucesso.' });
  } catch (err) {
    await t.rollback();
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

module.exports = { getProfile, updateProfile, getAllUsers, getMenteeDashboard, getMentorDashboard, updateUserByOrganizer, setUserStatus, deleteUserByOrganizer };
