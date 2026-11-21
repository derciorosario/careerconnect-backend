'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MentorshipRequest = sequelize.define('MentorshipRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mentee_id: { type: DataTypes.UUID, allowNull: false },
  mentor_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'accepted', 'declined'), defaultValue: 'pending' },
  message: { type: DataTypes.TEXT },
  decided_at: { type: DataTypes.DATE },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = MentorshipRequest;
