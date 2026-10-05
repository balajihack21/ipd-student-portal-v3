import express from 'express';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

import sequelize from './models/index.js';
import TeamUpload from './models/TeamUpload.js';
import User from './models/User.js';
import Mentor from './models/Mentor.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js'
import mentorRoutes from './routes/mentor.js'
import rubricRoutes from './routes/rubricsRoutes.js'
import adminAnalyticsRoutes from './routes/adminAnalytics.js'
import exportScoresRoutes from './routes/exportScores.js'

const app = express();

// Helmet CSP setup
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    },
  })
);


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Logging
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/adminpage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.use('/templates', express.static(path.join(__dirname, 'public/templates')));
app.use('/mentor',mentorRoutes)
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/admin',adminRoutes)
app.use('/rubrics',rubricRoutes)
app.use('/admin',adminAnalyticsRoutes)
app.use('/mentor',exportScoresRoutes)

// Sequelize associations
TeamUpload.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
TeamUpload.belongsTo(Mentor, { foreignKey: 'mentor_id', onDelete: 'SET NULL' });

User.hasMany(TeamUpload, { foreignKey: 'user_id' });
Mentor.hasMany(TeamUpload, { foreignKey: 'mentor_id' });

// Start server
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch((err) => console.error('Connection error:', err));

sequelize.sync().then(() => {
  app.listen(process.env.PORT || 3000, () =>
    console.log(`✅ Server running on http://localhost:${process.env.PORT || 4000}`)
  );
});
