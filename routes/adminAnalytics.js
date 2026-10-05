import { Op } from 'sequelize';
import express from 'express';
import sequelize from '../models/index.js';
import User from '../models/User.js';
import TeamUpload from '../models/TeamUpload.js';
import BatchTimeline from '../models/BatchTimeline.js';

const router = express.Router();

// GET /admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalTeams = await User.count();

    const totalSubmissions = await TeamUpload.count();

    const reviewedSubmissions = await TeamUpload.count({
      where: { status: 'REVIEWED' },
    });

    const submissionRate =
      totalTeams > 0
        ? parseFloat(((totalSubmissions / (totalTeams * 9)) * 100).toFixed(1))
        : 0;

    const completedTeams = await TeamUpload.count({
      where: { week_number: 9, status: 'SUBMITTED' },
    });

    const completionRate =
      totalTeams > 0
        ? parseFloat(((completedTeams / totalTeams) * 100).toFixed(1))
        : 0;

    const users = await User.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('review1_score')), 'avgReview1'],
        [sequelize.fn('AVG', sequelize.col('review2_score')), 'avgReview2'],
      ],
      raw: true,
    });

    const submissionsByWeek = await TeamUpload.findAll({
      attributes: [
        'week_number',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['week_number'],
      order: [['week_number', 'ASC']],
      raw: true,
    });

    const latestTimeline = await BatchTimeline.findAll({
      attributes: ['batch', 'stage', 'start', 'deadline'],
      order: [['batch', 'ASC'], ['stage', 'ASC']],
    });

    res.json({
      totalTeams,
      totalSubmissions,
      reviewedSubmissions,
      submissionRate,
      completionRate,
      reviews: reviewedSubmissions,
      avgReview1: users[0]?.avgReview1
        ? parseFloat(users[0].avgReview1).toFixed(2)
        : 0,
      avgReview2: users[0]?.avgReview2
        ? parseFloat(users[0].avgReview2).toFixed(2)
        : 0,
      submissionsByWeek: submissionsByWeek.map((s) => ({
        week: s.week_number,
        count: parseInt(s.count, 10),
      })),
      timelines: latestTimeline.map((t) => ({
        batch: t.batch,
        stage: t.stage,
        start: t.start,
        deadline: t.deadline,
      })),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
