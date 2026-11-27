'use strict';
const { Connection, User, Message, MentorshipRequest } = require('../models');
const { Op } = require('sequelize');

const getConnections = async (req, res) => {
  try {
    const userId = req.userId;
    const connections = await Connection.findAll({
      where: { [Op.or]: [{ user_a: userId }, { user_b: userId }] },
      include: [
        { model: User, as: 'userA', attributes: ['id', 'name', 'email', 'phone', 'photo_url', 'linkedin_url', 'role'] },
        { model: User, as: 'userB', attributes: ['id', 'name', 'email', 'phone', 'photo_url', 'linkedin_url', 'role'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const formatted = connections.map(c => {
      const other = c.user_a === userId ? c.userB : c.userA;
      return {
        id: c.id,
        origin: c.origin,
        created_at: c.created_at,
        contact: {
          id: other.id,
          name: other.name,
          email: other.email,
          phone: other.phone,
          photo_url: other.photo_url,
          linkedin_url: other.linkedin_url,
          role: other.role,
        },
      };
    });

    res.json({ connections: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Find-or-create a connection with another user so a conversation can be
// opened without a pre-existing connection. Enforces mentor <-> mentee only.
const ensureConnection = async (req, res) => {
  try {
    const userId = req.userId;
    const { to_user_id } = req.body;

    if (!to_user_id) {
      return res.status(400).json({ message: 'to_user_id is required' });
    }
    if (String(to_user_id) === String(userId)) {
      return res.status(400).json({ message: 'Não podes enviar mensagens a ti próprio.' });
    }

    const [me, other] = await Promise.all([
      User.findByPk(userId, { attributes: ['id', 'role'] }),
      User.findByPk(to_user_id, { attributes: ['id', 'name', 'email', 'phone', 'photo_url', 'linkedin_url', 'role'] }),
    ]);
    if (!other) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (me.role === other.role) {
      return res.status(403).json({ message: 'Só podes enviar mensagens entre mentor e mentorado.' });
    }

    let connection = await Connection.findOne({
      where: { [Op.or]: [{ user_a: userId, user_b: to_user_id }, { user_a: to_user_id, user_b: userId }] },
    });
    if (!connection) {
      connection = await Connection.create({ user_a: userId, user_b: to_user_id, origin: 'mutual' });
    }

    res.json({
      connection: {
        id: connection.id,
        origin: connection.origin,
        created_at: connection.created_at,
        contact: {
          id: other.id,
          name: other.name,
          email: other.email,
          phone: other.phone,
          photo_url: other.photo_url,
          linkedin_url: other.linkedin_url,
          role: other.role,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getConnections, ensureConnection };
