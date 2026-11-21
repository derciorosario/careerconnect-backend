'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  role: { type: DataTypes.ENUM('mentee', 'mentor', 'organizer'), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING },
  password_hash: { type: DataTypes.STRING },
  password_salt: { type: DataTypes.STRING },
  otp_code: { type: DataTypes.STRING },
  otp_expires_at: { type: DataTypes.DATE },
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  emailVerifiedAt: { type: DataTypes.DATE },
  photo_url: { type: DataTypes.TEXT },
  linkedin_url: { type: DataTypes.TEXT },
  consent_at: { type: DataTypes.DATE },
  consent_version: { type: DataTypes.STRING },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
