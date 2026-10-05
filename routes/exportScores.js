import express from 'express';
import xlsx from 'xlsx';
import authenticate from '../middleware/authenticate.js';
import Mentor from '../models/Mentor.js';
import User from '../models/User.js';
import Student from '../models/Student.js';

const router = express.Router();

// GET /mentor/export-scores?batch=24IPD
router.get('/export-scores', authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { batch } = req.query;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: 'Only coordinators can export scores' });
    }

    const userWhere = {};
    if (batch === '24ipd' || batch === '25ipd') {
      userWhere.UserId = { [Op.like]: `${batch}%` };
    }

    const teams = await User.findAll({
      attributes: ['UserId', 'team_name'],
      where: userWhere,
      include: [
        {
          model: Student,
          attributes: [
            'student_name',
            'register_no',
            'dept',
            'section',
            'sem2_review1',
            'sem2_review2',
            'sem2_workbook',
          ],
          where: { is_leader: true },
          required: true,
        },
      ],
    });

    const rows = teams.map((team) => {
      const student = team.Students?.[0];
      if (!student) return null;
      const r1 = student.sem2_review1 || 0;
      const r2 = student.sem2_review2 || 0;
      const wb = student.sem2_workbook || 0;
      const total = r1 + r2 + wb;
      return {
        TeamID: team.UserId,
        TeamName: team.team_name,
        RegisterNo: student.register_no,
        StudentName: student.student_name,
        Dept: student.dept,
        Section: student.section,
        Review1: r1,
        Review2: r2,
        Workbook: wb,
        Total: total,
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(rows.filter(Boolean));
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Scores');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="scores_${batch || 'all'}_${new Date().toISOString().slice(0, 10)}.xlsx"`
    );
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
