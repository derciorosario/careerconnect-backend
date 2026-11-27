'use strict';
const { Message, Connection, User } = require('../models');
const { Op } = require('sequelize');
const { sendEmail, messageReceivedEmailHtml } = require('../utils/email');
const { notifyWhatsApp } = require('../utils/whatsapp');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Find an existing connection between two users, regardless of order.
const findConnection = (a, b) =>
  Connection.findOne({
    where: { [Op.or]: [{ user_a: a, user_b: b }, { user_a: b, user_b: a }] },
  });

// Only mentor <-> mentee conversations are allowed (never same-role).
const rolesCompatible = (roleA, roleB) => roleA !== roleB;

// Resolve the connection to use from either a connection_id or a to_user_id.
// When to_user_id is used, a connection is created on the fly if missing, so
// messaging no longer requires a pre-existing connection.
const resolveConnection = async (fromUserId, { connection_id, to_user_id }) => {
  if (connection_id) {
    const connection = await Connection.findByPk(connection_id);
    if (!connection || (connection.user_a !== fromUserId && connection.user_b !== fromUserId)) {
      return { error: 'Access denied', status: 403 };
    }
    return { connection };
  }

  if (!to_user_id) {
    return { error: 'connection_id or to_user_id is required', status: 400 };
  }
  if (String(to_user_id) === String(fromUserId)) {
    return { error: 'Não podes enviar mensagens a ti próprio.', status: 400 };
  }

  const [me, other] = await Promise.all([
    User.findByPk(fromUserId, { attributes: ['id', 'role'] }),
    User.findByPk(to_user_id, { attributes: ['id', 'role'] }),
  ]);
  if (!other) return { error: 'User not found', status: 404 };
  if (!rolesCompatible(me.role, other.role)) {
    return { error: 'Só podes enviar mensagens entre mentor e mentorado.', status: 403 };
  }

  let connection = await findConnection(fromUserId, to_user_id);
  if (!connection) {
    connection = await Connection.create({ user_a: fromUserId, user_b: to_user_id, origin: 'mutual' });
  }
  return { connection };
};

const getMessages = async (req, res) => {
  try {
    const { connection_id, to_user_id } = req.query;
    const userId = req.userId;

    let connection;
    if (connection_id) {
      connection = await Connection.findByPk(connection_id);
      if (!connection || (connection.user_a !== userId && connection.user_b !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (to_user_id) {
      // No connection yet -> empty conversation (do not create one here).
      connection = await findConnection(userId, to_user_id);
      if (!connection) return res.json({ messages: [] });
    } else {
      return res.status(400).json({ message: 'connection_id or to_user_id is required' });
    }

    const messages = await Message.findAll({
      where: { connection_id: connection.id },
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
    const { connection_id, to_user_id, body } = req.body;
    const fromUserId = req.userId;

    const resolved = await resolveConnection(fromUserId, { connection_id, to_user_id });
    if (resolved.error) {
      return res.status(resolved.status).json({ message: resolved.error });
    }
    const connection = resolved.connection;

    const message = await Message.create({
      connection_id: connection.id,
      from_user_id: fromUserId,
      body,
    });

    const msg = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'fromUser', attributes: ['id', 'name', 'photo_url'] }],
    });

    // Determine receiver (the other user in the connection)
    const receiverId = connection.user_a === fromUserId ? connection.user_b : connection.user_a;
    const receiver = await User.findByPk(receiverId, { attributes: ['id', 'name', 'email', 'phone', 'notify_email', 'notify_whatsapp'] });
    const sender = await User.findByPk(fromUserId, { attributes: ['id', 'name'] });

    if (receiver && receiver.email) {
      const preview = body.length > 60 ? body.slice(0, 60) + '…' : body;
      try {
        if (receiver.notify_email !== false) {
          sendEmail({
            to: receiver.email,
            subject: `Nova mensagem de ${sender.name} - Career Connect`,
            text: `Olá ${receiver.name}, recebeu uma nova mensagem de ${sender.name}: ${preview}`,
            html: messageReceivedEmailHtml({
              receiverName: receiver.name,
              senderName: sender.name,
              preview,
            }),
          });
        }
      } catch (emailErr) {
        console.error('Failed to send message email:', emailErr.message);
      }

      // Send the same notification via WhatsApp (if enabled and the receiver has a phone number)
      if (receiver.notify_whatsapp !== false) {
        await notifyWhatsApp(receiver.phone, `Olá ${receiver.name}, recebeu uma nova mensagem de ${sender.name} no Career Connect: ${preview}\n\n${FRONTEND_URL}`);
      }
    }

    res.status(201).json({ message: msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMessages, sendMessage };