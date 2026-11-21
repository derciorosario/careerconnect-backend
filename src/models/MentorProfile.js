'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MentorProfile = sequelize.define('MentorProfile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  job_title: { type: DataTypes.STRING },
  company: { type: DataTypes.STRING },
  sector: { type: DataTypes.STRING },
  years: { type: DataTypes.INTEGER },
  interests: { type: DataTypes.JSON },
  can_help_goals: { type: DataTypes.JSON },
  support_type: { type: DataTypes.STRING },
  max_mentees: { type: DataTypes.INTEGER, defaultValue: 3 },
  approval: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  approved_by: { type: DataTypes.UUID },
  approved_at: { type: DataTypes.DATE },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = MentorProfile;
