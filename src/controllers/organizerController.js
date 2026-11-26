'use strict';
const {
  User, MentorProfile, MenteeProfile, Registration, Round, Match, Feedback,
  Connection, MentorshipRequest, SurveyResponse, Event, AuditLog, RegistrationConfig,
} = require('../models');
const { Op } = require('sequelize');
const { sendEmail, mentorApprovedEmailHtml, welcomeEmailHtml } = require('../utils/email');
const { notifyWhatsApp } = require('../utils/whatsapp');
const { DEFAULT_REGISTRATION_CONFIG } = require('../utils/registrationDefaults');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
          attributes: ['id', 'name', 'email', 'phone', 'role', 'photo_url', 'linkedin_url'],
          include: [
            { model: MentorProfile, as: 'mentorProfile', attributes: { exclude: ['user_id', 'created_at', 'updated_at'] } },
            { model: MenteeProfile, as: 'menteeProfile', attributes: { exclude: ['user_id', 'created_at', 'updated_at'] } },
          ],
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
      const canEmail = user.notify_email !== false;
      const canWhatsapp = user.notify_whatsapp !== false;
      try {
        if (canEmail) {
          sendEmail({
            to: user.email,
            subject: action === 'approve' ? 'Mentor aprovado - Career Connect' : 'Candidatura de mentor - Career Connect',
            text: `Olá ${user.name}, a sua candidatura de mentor foi ${action === 'approve' ? 'aprovada' : 'rejeitada'}.`,
            html: mentorApprovedEmailHtml({ name: user.name, approved: action === 'approve' }),
          });
        }

        // Send the same notification via WhatsApp (if enabled and the user has a phone number)
        if (canWhatsapp) {
          await notifyWhatsApp(user.phone, `Olá ${user.name}, a sua candidatura de mentor no Career Connect foi ${action === 'approve' ? 'aprovada' : 'rejeitada'}.\n\n${FRONTEND_URL}`);
        }
      } catch (emailErr) {
        console.error('Failed to send mentor approval email:', emailErr.message);
      }

      // Welcome message for mentors once approved (email + WhatsApp).
      if (action === 'approve') {
        const welcomeText = `Olá ${user.name}, bem-vindo(a) ao Career Connect como mentor! A sua candidatura foi aprovada. Já pode entrar na sua área e começar a receber mentorados.`;
        try {
          if (canEmail) {
            sendEmail({
              to: user.email,
              subject: 'Bem-vindo(a) ao Career Connect',
              text: welcomeText,
              html: welcomeEmailHtml({ name: user.name, role: 'mentor' }),
            });
          }
          if (canWhatsapp) {
            await notifyWhatsApp(user.phone, `${welcomeText}\n\n${FRONTEND_URL}`);
          }
        } catch (welcomeErr) {
          console.error('Failed to send mentor welcome message:', welcomeErr.message);
        }
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

    // Oferta e procura por área, a partir da base de dados.
    // Oferta = mentores com interesse na área; Procura = mentorandos com interesse na área.
    const config = await RegistrationConfig.findOne({ order: [['created_at', 'DESC']] });
    const areas = (config && Array.isArray(config.areas) && config.areas.length > 0)
      ? config.areas
      : DEFAULT_REGISTRATION_CONFIG.areas;

    const mentorProfiles = await MentorProfile.findAll({ attributes: ['interests'] });
    const menteeProfiles = await MenteeProfile.findAll({ attributes: ['interests'] });
    const totalMentors = mentorProfiles.length;
    const totalMentees = menteeProfiles.length;
    const countArea = (profiles, area) => profiles.reduce(
      (sum, p) => sum + (Array.isArray(p.interests) && p.interests.includes(area) ? 1 : 0),
      0,
    );
    const areaSupplyDemand = areas.map((area) => {
      const supplyCount = countArea(mentorProfiles, area);
      const demandCount = countArea(menteeProfiles, area);
      return {
        area,
        supply: totalMentors > 0 ? Math.round((supplyCount / totalMentors) * 100) : 0,
        demand: totalMentees > 0 ? Math.round((demandCount / totalMentees) * 100) : 0,
      };
    });

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
      areaSupplyDemand,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboard, getRegistrations, approveMentor, getRoundStatus, getReports };
