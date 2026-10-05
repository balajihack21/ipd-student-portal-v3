import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const ValueProposition = sequelize.define('ValueProposition', {
  gain_creators: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gains: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  products_and_services: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customer_jobs: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pain_relievers: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pains: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  value_proposition: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customer_segment: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'value_proposition',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id'] // ensures one record per user
    }
  ]
});

// Associations
ValueProposition.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ValueProposition, { foreignKey: 'user_id' });

export default ValueProposition;
