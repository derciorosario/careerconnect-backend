'use strict';
const {
  User, MentorProfile, MenteeProfile, Registration, Round, Match, Feedback,
  Connection, MentorshipRequest, SurveyResponse, Event, AuditLog,
} = require('../models');
const { Op } = require('sequelize');
const { sendEmail, mentorApprovedEmailHtml } = require('../utils/email');

const getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const mentors = await User.count({ where: { role: 'mentor' } });
    const mentees = await User.count({ where: { role: 'mentee' } });
    const organizers = await User.count({ where: { role: 'organizer' } });

    const pendingMentors = await MentorProfile.count({ where: { approval: 'pending' } });
    const approvedMentors = await MentorProfile.count({ where: { approval: 'approved' } });

    const registrations = await Registration.count();
    const present = await Registration.count({ where: { status: 'present' } });

    const currentRound = await Round.findOne({
      where: { status: 'running' },
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
    });

    const totalMatches = await Match.count();
    const totalConnections = await Connection.count();
    const totalMentorshipRequests = await MentorshipRequest.count();
    const acceptedMentorships = await MentorshipRequest.count({ where: { status: 'accepted' } });

    const surveys = await SurveyResponse.findAll();
    const avgRating = surveys.length > 0
      ? surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length
      : 0;

    res.json({
      stats: {
        totalUsers, mentors, mentees, organizers,
        pendingMentors, approvedMentors,
        registrations, present,
        totalMatches, totalConnections, totalMentorshipRequests, acceptedMentorships,
        avgRating, totalSurveys: surveys.length,
      },
      currentRound,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRegistrations = async (req, res) => {
  try {
    const { role, status } = req.query;
    const where = {};
    if (status) where.status = status;

    const registrations = await Registration.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: role ? { role } : {},
          attributes: ['id', 'name', 'email', 'phone', 'role'],
          include: [{
            model: MentorProfile,
            as: 'mentorProfile',
            attributes: ['approval'],
          }],
        },
        { model: Event, as: 'event' },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ registrations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const approveMentor = async (req, res) => {
  try {
    const { mentor_id, action } = req.body; // action: 'approve' or 'reject'
    const organizerId = req.userId;

    const profile = await MentorProfile.findOne({ where: { user_id: mentor_id } });
    if (!profile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    profile.approval = action === 'approve' ? 'approved' : 'rejected';
    profile.approved_by = organizerId;
    profile.approved_at = new Date();
    await profile.save();

    const user = await User.findByPk(mentor_id);
    if (user) {
      try {
         sendEmail({
          to: user.email,
          subject: action === 'approve' ? 'Mentor aprovado - Career Connect' : 'Candidatura de mentor - Career Connect',
          text: `Olá ${user.name}, a sua candidatura de mentor foi ${action === 'approve' ? 'aprovada' : 'rejeitada'}.`,
          html: mentorApprovedEmailHtml({ name: user.name, approved: action === 'approve' }),
        });
      } catch (emailErr) {
        console.error('Failed to send mentor approval email:', emailErr.message);
      }
    }

    await AuditLog.create({
      actor_id: organizerId,
      action: action === 'approve' ? 'approve_mentor' : 'reject_mentor',
      entity: 'MentorProfile',
      entity_id: profile.id,
    });

    res.json({ profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRoundStatus = async (req, res) => {
  try {
    const rounds = await Round.findAll({
      order: [['break_no', 'ASC'], ['round_no', 'ASC']],
      include: [{
        model: Match,
        as: 'matches',
        include: [{ model: User, as: 'mentor', attributes: ['id', 'name', 'photo_url'] }],
      }],
    });
    res.json({ rounds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getReports = async (req, res) => {
  try {
    const registrations = await Registration.findAll();
    const present = await Registration.count({ where: { status: 'present' } });
    const conversations = await Feedback.count();
    const mutualConnections = await Connection.count({ where: { origin: 'mutual' } });
    const mentorships = await MentorshipRequest.count({ where: { status: 'accepted' } });

    const surveys = await SurveyResponse.findAll();
    const avgRating = surveys.length > 0
      ? surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length
      : 0;
    const avgNPS = surveys.length > 0
      ? surveys.reduce((sum, s) => sum + (s.nps || 0), 0) / surveys.length
      : 0;

    res.json({
      totalRegistrations: registrations.length,
      present,
      presenceRate: registrations.length > 0 ? (present / registrations.length) * 100 : 0,
      conversations,
      mutualConnections,
      mentorships,
      avgRating,
      avgNPS,
      totalSurveys: surveys.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboard, getRegistrations, approveMentor, getRoundStatus, getReports };
