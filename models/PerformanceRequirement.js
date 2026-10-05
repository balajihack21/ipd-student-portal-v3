// models/PerformanceRequirement.js

import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const PerformanceRequirement = sequelize.define('PerformanceRequirement', {

  performance_data: {
    type: DataTypes.JSON,  // [{parameter, expectedPerformance, justification}]
    allowNull: true
  }

}, {
  tableName: 'performance_requirements',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id']
    }
  ]
});

PerformanceRequirement.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(PerformanceRequirement, { foreignKey: 'user_id' });

export default PerformanceRequirement;