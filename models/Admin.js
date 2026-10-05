// models/Admin.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Admin = sequelize.define('Admin', {
  adminId: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  // Review 1 timeline
  review1_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  review1_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Problem Statement timeline
  problem_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  problem_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // SWOT Analysis timeline
  swot_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  swot_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Value Proposition timeline
  value_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  value_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Review 2 timeline
  review2_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  review2_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  tableName: 'admins'
});

export default Admin;
