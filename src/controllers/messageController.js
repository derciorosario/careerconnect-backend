'use strict';
const { Message, Connection, User } = require('../models');

const getMessages = async (req, res) => {
  try {
    const { connection_id } = req.query;
    const userId = req.userId;

    // Verify user is part of connection
    const connection = await Connection.findByPk(connection_id);
    if (!connection || (connection.user_a !== userId && connection.user_b !== userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.findAll({
      where: { connection_id },
      include: [{ model: User, as: 'fromUser', attributes: ['id', 'name', 'photo_url'] }],
      order: [['created_at', 'ASC']],
    });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { connection_id, body } = req.body;
    const fromUserId = req.userId;

    const connection = await Connection.findByPk(connection_id);
    if (!connection || (connection.user_a !== fromUserId && connection.user_b !== fromUserId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await Message.create({
      connection_id,
      from_user_id: fromUserId,
      body,
    });

    const msg = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'fromUser', attributes: ['id', 'name', 'photo_url'] }],
    });

    res.status(201).json({ message: msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMessages, sendMessage };
