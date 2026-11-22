'use strict';
const { Booking, Session, User, AuditLog } = require('../models');

const createBooking = async (req, res) => {
  try {
    const { session_id } = req.body;
    const userId = req.userId;

    if (!session_id) {
      return res.status(400).json({ message: 'session_id is required' });
    }

    const session = await Session.findByPk(session_id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if already booked
    const existing = await Booking.findOne({ where: { user_id: userId, session_id } });
    if (existing) {
      return res.status(400).json({ message: 'Já tem este masterclass reservado' });
    }

    const booking = await Booking.create({ user_id: userId, session_id });

    await AuditLog.create({
      actor_id: userId,
      action: 'book_session',
      entity: 'Booking',
      entity_id: booking.id,
    });

    res.status(201).json({ booking, message: 'Masterclass reservada com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const userId = req.userId;

    const bookings = await Booking.findAll({
      where: { user_id: userId },
      include: [{ model: Session, as: 'session' }],
      order: [['created_at', 'DESC']],
    });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createBooking, getMyBookings };
