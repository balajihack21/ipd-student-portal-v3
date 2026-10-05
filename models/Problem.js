import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const ProblemStatement = sequelize.define('ProblemStatement', {
  problem_description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  selected_idea: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  user_id: {
    type: DataTypes.STRING, // must match User.UserId type (STRING)
    allowNull: false,
    references: {
      model: User,
      key: 'UserId' // ✅ this is your actual PK in User.js
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'problem_statements',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id']
    }
  ]
});

// Associations
ProblemStatement.belongsTo(User, { foreignKey: 'user_id' }); 
User.hasMany(ProblemStatement, { foreignKey: 'user_id' });


export default ProblemStatement;
