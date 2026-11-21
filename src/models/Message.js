'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  connection_id: { type: DataTypes.UUID, allowNull: false },
  from_user_id: { type: DataTypes.UUID, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  read_at: { type: DataTypes.DATE },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Message;
