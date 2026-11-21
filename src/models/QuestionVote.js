'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuestionVote = sequelize.define('QuestionVote', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  question_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = QuestionVote;
