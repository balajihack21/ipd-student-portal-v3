// models/UserRequirementCanvas.js

import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const UserRequirementCanvas = sequelize.define('UserRequirementCanvas', {

  user_requirements: {
    type: DataTypes.JSON,   // store 10 rows as array
    allowNull: true
  },

  product_features: {
    type: DataTypes.JSON,   // store 10 rows as array
    allowNull: true
  },

  must_have: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  should_have: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  could_have: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  wont_have: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {
  tableName: 'user_requirement_canvas',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id'] // one canvas per team
    }
  ]
});

// Associations
UserRequirementCanvas.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(UserRequirementCanvas, { foreignKey: 'user_id' });

export default UserRequirementCanvas;