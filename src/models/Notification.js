'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  channel: { type: DataTypes.ENUM('app', 'email', 'whatsapp', 'sms'), defaultValue: 'app' },
  template: { type: DataTypes.STRING },
  payload: { type: DataTypes.JSON },
  status: { type: DataTypes.STRING, defaultValue: 'sent' },
  sent_at: { type: DataTypes.DATE },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Notification;
