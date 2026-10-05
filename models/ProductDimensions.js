// models/ProductDimensions.js

import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const ProductDimensions = sequelize.define('ProductDimensions', {

  dimensions: {
    type: DataTypes.JSON,   // [{parameter, dimension}]
    allowNull: true
  }

}, {
  tableName: 'product_dimensions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id']
    }
  ]
});

ProductDimensions.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(ProductDimensions, { foreignKey: 'user_id' });

export default ProductDimensions;