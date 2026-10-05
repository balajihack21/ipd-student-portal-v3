import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const BatchConfig = sequelize.define('BatchConfig', {
  batch: { type: DataTypes.STRING(20), primaryKey: true, allowNull: false },
  current_semester: {
    type: DataTypes.ENUM('sem1', 'sem2'),
    allowNull: false,
    defaultValue: 'sem1'
  }
}, {
  tableName: 'batch_configs'
});

export default BatchConfig;