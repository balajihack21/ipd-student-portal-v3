import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const SwotAnalysis = sequelize.define('SwotAnalysis', {
  team_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  selected_idea: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  strengths: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  weakness: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  opportunities: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  threats: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'swot_analysis',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id'] // removed `date`
    }
  ]
});

// Associations
SwotAnalysis.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(SwotAnalysis, { foreignKey: 'user_id' });

export default SwotAnalysis;
