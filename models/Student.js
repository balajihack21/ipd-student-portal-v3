import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const Student = sequelize.define('Student', {
  register_no: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  student_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dept: {
    type: DataTypes.STRING,
    allowNull: false
  },
  section: {
    type: DataTypes.STRING,
    allowNull: false
  },
   mobile: {
    type: DataTypes.STRING(12),
    allowNull: true,
    defaultValue: null
  },
  is_leader: {
    type: DataTypes.BOOLEAN,
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
 sem1_review1: {
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
 sem1_review2: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sem1_workbook: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
   sem2_review1: {
  type: DataTypes.INTEGER,
  allowNull: true
},
sem2_review2: {
  type: DataTypes.INTEGER,
  allowNull: true
},
sem2_workbook: {
  type: DataTypes.INTEGER,
  allowNull: true
},
sem3_review1: {
  type: DataTypes.INTEGER,
  allowNull: true
},
sem3_review2: {
  type: DataTypes.INTEGER,
  allowNull: true
},
sem3_workbook: {
  type: DataTypes.INTEGER,
  allowNull: true
},
sem4_review1: {
  type: DataTypes.INTEGER,
  allowNull: true
},
sem4_review2: {
  type: DataTypes.INTEGER,
  allowNull: true
},
sem4_workbook: {
  type: DataTypes.INTEGER,
  allowNull: true
}
}, {
  tableName: 'students'
});

// Associations
Student.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Student, { foreignKey: 'user_id' });

export default Student;
