'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Feedback = sequelize.define('Feedback', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  match_id: { type: DataTypes.UUID, allowNull: false },
  from_user_id: { type: DataTypes.UUID, allowNull: false },
  to_user_id: { type: DataTypes.UUID, allowNull: false },
  wants_to_continue: { type: DataTypes.BOOLEAN, defaultValue: false },
  usefulness: { type: DataTypes.INTEGER },
  private_note: { type: DataTypes.TEXT },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Feedback;
