'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  actor_id: { type: DataTypes.UUID },
  action: { type: DataTypes.STRING, allowNull: false },
  entity: { type: DataTypes.STRING },
  entity_id: { type: DataTypes.UUID },
  at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  timestamps: false,
});

module.exports = AuditLog;
