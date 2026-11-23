'use strict';
const { Registration, User, Event, AuditLog } = require('../models');

const registerForEvent = async (req, res) => {
  try {
    const { event_id } = req.body;
    const userId = req.userId;

    const event = await Event.findByPk(event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existing = await Registration.findOne({ where: { event_id, user_id: userId } });
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const ticket_code = 'CC-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const registration = await Registration.create({
      event_id,
      user_id: userId,
      ticket_code,
      status: 'registered',
    });

    await AuditLog.create({
      actor_id: userId,
      action: 'register_event',
      entity: 'Registration',
      entity_id: registration.id,
    });

    res.status(201).json({ registration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const checkIn = async (req, res) => {
  try {
    const { ticket_code, user_id } = req.body;
    const organizerId = req.userId;

    let registration;
    if (ticket_code) {
      registration = await Registration.findOne({ where: { ticket_code } });
    } else if (user_id) {
      registration = await Registration.findOne({ where: { user_id } });
    } else {
      return res.status(400).json({ message: 'ticket_code or user_id required' });
    }

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status === 'present') {
      return res.status(400).json({ message: 'Already checked in' });
    }

    // Check mentor approval if mentor
    const user = await User.findByPk(registration.user_id);
    if (user.role === 'mentor') {
      const { MentorProfile } = require('../models');
      const profile = await MentorProfile.findOne({ where: { user_id: registration.user_id } });
      if (!profile || profile.approval !== 'approved') {
        return res.status(403).json({ message: 'Mentor not approved yet' });
      }
    }

    registration.status = 'present';
    registration.checked_in_at = new Date();
    registration.checked_in_by = organizerId;
    await registration.save();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'check_in',
      entity: 'Registration',
      entity_id: registration.id,
    });

    res.json({ registration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const walkIn = async (req, res) => {
  try {
    const { event_id, name, phone, role, area } = req.body;
    const organizerId = req.userId;

    // Create a walk-in user
    const user = await User.create({
      name,
      email: `walkin-${Date.now()}@careerconnect.local`,
      phone,
      role,
      password_hash: null,
    });

    if (role === 'mentee') {
      const { MenteeProfile } = require('../models');
      await MenteeProfile.create({ user_id: user.id, interests: area ? [area] : [] });
    } else if (role === 'mentor') {
      const { MentorProfile } = require('../models');
      await MentorProfile.create({ user_id: user.id, approval: 'approved', max_mentees: 3 });
    }

    const event = await Event.findByPk(event_id);
    const ticket_code = 'CC-' + Math.random().toString(36).slice(2, 7).toUpperCase();

    const registration = await Registration.create({
      event_id,
      user_id: user.id,
      ticket_code,
      status: 'present',
      checked_in_at: new Date(),
      checked_in_by: organizerId,
      walk_in: true,
    });

    await AuditLog.create({
      actor_id: organizerId,
      action: 'walk_in',
      entity: 'Registration',
      entity_id: registration.id,
    });

    res.status(201).json({ user, registration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const cancelCheckIn = async (req, res) => {
  try {
    const { registration_id } = req.body;
    const organizerId = req.userId;

    const registration = await Registration.findByPk(registration_id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.status = 'cancelled';
    registration.checked_in_at = null;
    registration.checked_in_by = null;
    await registration.save();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'cancel_check_in',
      entity: 'Registration',
      entity_id: registration.id,
    });

    res.json({ registration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRegistrations = async (req, res) => {
  try {
    const { role, status } = req.query;
    const where = {};
    if (role) where.role = role;
    
    const registrations = await Registration.findAll({
      where: status ? { status } : {},
      include: [
        { model: User, as: 'user', where, attributes: ['id', 'name', 'email', 'phone', 'role'] },
        { model: Event, as: 'event' },
      ],
    });
    res.json({ registrations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRegistration = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { id } = req.params;

    const registration = await Registration.findByPk(id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    await registration.destroy();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'delete_registration',
      entity: 'Registration',
      entity_id: id,
    });

    res.json({ message: 'Registration deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRegistrationByTicket = async (req, res) => {
  try {
    const { ticket_code } = req.query;
    if (!ticket_code) {
      return res.status(400).json({ message: 'ticket_code required' });
    }

    const registration = await Registration.findOne({
      where: { ticket_code },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role'] },
        { model: Event, as: 'event' },
      ],
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json({ registration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerForEvent, checkIn, walkIn, cancelCheckIn, getRegistrations, deleteRegistration, getRegistrationByTicket };
