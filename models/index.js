// server/config/db.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.NEW_MYSQL_DATABASE,
  process.env.NEW_MYSQL_USER,
  process.env.NEW_MYSQL_PASSWORD,
  {
    host: process.env.NEW_MYSQL_HOST,
    port: process.env.NEW_MYSQL_PORT,
    dialect: 'mysql',
    logging: false,
  }
);

export default sequelize;
