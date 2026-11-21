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

module.exports = { getConnections };
