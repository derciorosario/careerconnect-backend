'use strict';
const { MentorshipRequest, User, MentorProfile, MenteeProfile, AuditLog, Connection } = require('../models');
const { sendEmail, mentorshipRequestReceivedEmailHtml, mentorshipRequestRespondedEmailHtml, connectionCreatedEmailHtml } = require('../utils/email');
const { notifyWhatsApp } = require('../utils/whatsapp');

const createRequest = async (req, res) => {
  try {
    const { mentor_id, message } = req.body;
    const menteeId = req.userId;

    const mentorProfile = await MentorProfile.findOne({ where: { user_id: mentor_id } });
    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Check mentor limit
    const acceptedCount = await MentorshipRequest.count({
      where: { mentor_id, status: 'accepted' },
    });
    if (acceptedCount >= mentorProfile.max_mentees) {
      return res.status(400).json({ message: 'Mentor has reached maximum mentees' });
    }

    const existing = await MentorshipRequest.findOne({
      where: { mentee_id: menteeId, mentor_id },
    });
    if (existing) {
      return res.status(400).json({ message: 'Request already exists' });
    }

    const request = await MentorshipRequest.create({
      mentee_id: menteeId,
      mentor_id,
      message,
      status: 'pending',
    });

    await AuditLog.create({
      actor_id: menteeId,
      action: 'create_mentorship_request',
      entity: 'MentorshipRequest',
      entity_id: request.id,
    });

    // Send email to mentor about new request
    const mentee = await User.findByPk(menteeId, { attributes: ['id', 'name', 'email', 'phone'] });
    const mentor = await User.findByPk(mentor_id, { attributes: ['id', 'name', 'email', 'phone'] });
    if (mentor && mentor.email && mentee) {
      try {
        sendEmail({
          to: mentor.email,
          subject: `Novo pedido de mentoria de ${mentee.name} - Career Connect`,
          text: `Olá ${mentor.name}, ${mentee.name} enviou-lhe um pedido de mentoria.${message ? ` Mensagem: "${message}"` : ''}`,
          html: mentorshipRequestReceivedEmailHtml({
            mentorName: mentor.name,
            menteeName: mentee.name,
            message: message || '',
          }),
        });
      } catch (emailErr) {
        console.error('Failed to send mentorship request email:', emailErr.message);
      }

      // Send the same notification via WhatsApp (if the mentor has a phone number)
      await notifyWhatsApp(mentor.phone, `Olá ${mentor.name}, ${mentee.name} enviou-lhe um pedido de mentoria no Career Connect.${message ? ` Mensagem: "${message}"` : ''}`);
    }

    res.status(201).json({ request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const requests = await MentorshipRequest.findAll({
      where: { mentee_id: userId },
      include: [{ model: User, as: 'mentor', attributes: ['id', 'name', 'photo_url'], include: [{ model: MentorProfile, as: 'mentorProfile', attributes: ['company', 'job_title'] }] }],
    });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRequestsForMentor = async (req, res) => {
  try {
    const userId = req.userId;
    const requests = await MentorshipRequest.findAll({
      where: { mentor_id: userId },
      include: [{
        model: User,
        as: 'mentee',
        attributes: ['id', 'name', 'photo_url'],
        include: [{ model: MenteeProfile, as: 'menteeProfile', attributes: ['goal', 'pitch', 'course'] }],
      }],
    });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const respondToRequest = async (req, res) => {
  try {
    const { request_id, status } = req.body; // status: 'accepted' or 'declined'
    const mentorId = req.userId;

    const request = await MentorshipRequest.findByPk(request_id);
    if (!request || request.mentor_id !== mentorId) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    request.decided_at = new Date();
    await request.save();

    // Fetch mentee and mentor for emails
    const mentee = await User.findByPk(request.mentee_id, { attributes: ['id', 'name', 'email', 'phone'] });
    const mentor = await User.findByPk(mentorId, { attributes: ['id', 'name', 'email', 'phone'] });

    // If accepted, create connection
    if (status === 'accepted') {
      const [user_a, user_b] = [request.mentee_id, request.mentor_id].sort((a, b) => a - b);

      const existing = await Connection.findOne({ where: { user_a, user_b } });
      if (!existing) {
        await Connection.create({ user_a, user_b, origin: 'mentorship' });
      }

      // Send connection created email to both
      if (mentee && mentee.email && mentor) {
        try {
          sendEmail({
            to: mentee.email,
            subject: `Ligação criada com ${mentor.name} - Career Connect`,
            text: `Olá ${mentee.name}, está agora conectado com ${mentor.name}.`,
            html: connectionCreatedEmailHtml({
              userName: mentee.name,
              contactName: mentor.name,
              contactRole: 'Mentor',
            }),
          });
        } catch (emailErr) {
          console.error('Failed to send connection email to mentee:', emailErr.message);
        }

        // Send the same notification via WhatsApp (if the mentee has a phone number)
        await notifyWhatsApp(mentee.phone, `Olá ${mentee.name}, está agora conectado com ${mentor.name} no Career Connect.`);
      }
      if (mentor && mentor.email && mentee) {
        try {
          sendEmail({
            to: mentor.email,
            subject: `Nova ligação com ${mentee.name} - Career Connect`,
            text: `Olá ${mentor.name}, está agora conectado com ${mentee.name}.`,
            html: connectionCreatedEmailHtml({
              userName: mentor.name,
              contactName: mentee.name,
              contactRole: 'Mentorado',
            }),
          });
        } catch (emailErr) {
          console.error('Failed to send connection email to mentor:', emailErr.message);
        }

        // Send the same notification via WhatsApp (if the mentor has a phone number)
        await notifyWhatsApp(mentor.phone, `Olá ${mentor.name}, está agora conectado com ${mentee.name} no Career Connect.`);
      }
    }

    // Send email to mentee about the response
    if (mentee && mentee.email) {
      try {
        sendEmail({
          to: mentee.email,
          subject: status === 'accepted' ? `Pedido de mentoria aceite - Career Connect` : `Pedido de mentoria recusado - Career Connect`,
          text: status === 'accepted'
            ? `Olá ${mentee.name}, o seu pedido de mentoria foi aceite por ${mentor ? mentor.name : 'o mentor'}.`
            : `Olá ${mentee.name}, o seu pedido de mentoria foi recusado por ${mentor ? mentor.name : 'o mentor'}.`,
          html: mentorshipRequestRespondedEmailHtml({
            menteeName: mentee.name,
            mentorName: mentor ? mentor.name : 'Mentor',
            status,
          }),
        });
        } catch (emailErr) {
          console.error('Failed to send mentorship response email:', emailErr.message);
        }

        // Send the same notification via WhatsApp (if the mentee has a phone number)
        await notifyWhatsApp(mentee.phone, status === 'accepted'
          ? `Olá ${mentee.name}, o seu pedido de mentoria foi aceite por ${mentor ? mentor.name : 'o mentor'} no Career Connect.`
          : `Olá ${mentee.name}, o seu pedido de mentoria foi recusado por ${mentor ? mentor.name : 'o mentor'} no Career Connect.`);
      }

    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRequest, getMyRequests, getRequestsForMentor, respondToRequest };
