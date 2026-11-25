'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Question = sequelize.define('Question', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  session_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  mentor_id: { type: DataTypes.UUID, allowNull: true },
  body: { type: DataTypes.TEXT, allowNull: false },
  anonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.ENUM('visible', 'hidden', 'answered'), defaultValue: 'visible' },
  projected: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Question;
