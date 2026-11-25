'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SurveyResponse = sequelize.define('SurveyResponse', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  event_id: { type: DataTypes.UUID, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: true },
  nps: { type: DataTypes.INTEGER },
  comment: { type: DataTypes.TEXT },
  answers: { type: DataTypes.JSON, allowNull: true },
  impact_answers: { type: DataTypes.JSON, allowNull: true },
  main_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
  impact_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SurveyResponse;
