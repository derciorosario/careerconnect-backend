'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PollVote = sequelize.define('PollVote', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  poll_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  option_index: { type: DataTypes.INTEGER, allowNull: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PollVote;
