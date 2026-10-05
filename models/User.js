// models/User.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import Mentor from './Mentor.js';

const User = sequelize.define('User', {
  UserId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true
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
  mobile: {
    type: DataTypes.STRING(12),
    allowNull: false
  },
  team_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  profilePhoto: {
  type: DataTypes.STRING,
  allowNull: true,
},
  token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mentor_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    references: {
      model: 'mentors',
      key: 'mentorId'
    },
    onDelete: 'CASCADE'
  },
  firstLogin: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isLocked: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false
},
   rubric1: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric2: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric3: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric4: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric5: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric6: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric7: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric8: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric9: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric10: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  review1_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  review2_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sem2_review1: {
  type: DataTypes.INTEGER,
  allowNull: true
}
}, { tableName: 'users' });

// Associations
Mentor.hasMany(User, {
  foreignKey: 'mentor_id',
  as: 'teams'
});

User.belongsTo(Mentor, {
  foreignKey: 'mentor_id',
  as: 'mentor'
});

export default User;
