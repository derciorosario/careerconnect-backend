'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MenteeProfile = sequelize.define('MenteeProfile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  level: { type: DataTypes.ENUM('estudante', 'recem_graduado', 'profissional_junior') },
  course: { type: DataTypes.STRING },
  institution: { type: DataTypes.STRING },
  interests: { type: DataTypes.JSON },
  goal: { type: DataTypes.STRING },
  pitch: { type: DataTypes.STRING(120) },
  job_obstacle: { type: DataTypes.STRING },
  approval: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  approved_by: { type: DataTypes.UUID },
  approved_at: { type: DataTypes.DATE },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = MenteeProfile;
