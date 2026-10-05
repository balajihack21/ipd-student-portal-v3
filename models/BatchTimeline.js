import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const BatchTimeline = sequelize.define('BatchTimeline', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  batch: { type: DataTypes.STRING(20), allowNull: false },   // e.g. "24IPD", "25IPD"
  stage: { type: DataTypes.STRING(30), allowNull: false },   // 'review1'|'problem'|'swot'|'value'|'review2'
  start: { type: DataTypes.DATE, allowNull: true },
  deadline: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'batch_timelines',
  indexes: [{ unique: true, fields: ['batch', 'stage'] }]
});

export default BatchTimeline;