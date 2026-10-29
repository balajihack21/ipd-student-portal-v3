import express from 'express';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
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

const redirectHosts = [
  'act-ipd-5153.onrender.com',
  'act-ipd.onrender.com',
  'agni-ipd.onrender.com'
];

app.use((req, res, next) => {
  if (redirectHosts.includes(req.hostname.toLowerCase())) {
    return res.redirect(301, `https://act-ipd.site${req.originalUrl}`);
  }

  next();
});

// Helmet CSP setup
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      mediaSrc: ["'self'", "https://s3.us-east-005.backblazeb2.com"],
    },
  })
);


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: true,
  lastModified: true,
}));

app.get('/favicon.ico', (req, res) => {
  res.type('png');
  res.sendFile(path.join(__dirname, 'public', 'images', 'IPD_Design_Logo.png'));
});

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
