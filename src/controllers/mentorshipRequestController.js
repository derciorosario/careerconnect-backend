'use strict';
const { MentorshipRequest, User, MentorProfile, MenteeProfile, AuditLog } = require('../models');

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

    // If accepted, create connection
    if (status === 'accepted') {
      const { Connection } = require('../models');
      const [user_a, user_b] = [request.mentee_id, request.mentor_id].sort((a, b) => a - b);
      
      const existing = await Connection.findOne({ where: { user_a, user_b } });
      if (!existing) {
        await Connection.create({ user_a, user_b, origin: 'mentorship' });
      }
    }

    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRequest, getMyRequests, getRequestsForMentor, respondToRequest };
