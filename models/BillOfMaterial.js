// models/BillOfMaterial.js

import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const BillOfMaterial = sequelize.define('BillOfMaterial', {

  bom_data: {
    type: DataTypes.JSON,  // [{component, material, quantity}]
    allowNull: true
  }

}, {
  tableName: 'bill_of_materials',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id']
    }
  ]
});

BillOfMaterial.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(BillOfMaterial, { foreignKey: 'user_id' });

export default BillOfMaterial;