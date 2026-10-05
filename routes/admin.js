// backend/adminRoutes.js
import express from 'express';
import { Op } from 'sequelize';
import sequelize from '../models/index.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import TeamUpload from '../models/TeamUpload.js';
import IdeaSelection from '../models/Idea.js'
import SwotAnalysis from '../models/Swot.js'
import ProblemStatement from '../models/Problem.js'
import ValueProposition from '../models/Value.js'
import dotenv from 'dotenv';
import Sib from 'sib-api-v3-sdk';
import {getSignedFileUrl}  from "../backblaze.js";


const router = express.Router();

// =============== ADMIN: Get All Ideas or Specific User ==================
router.get("/ideas", async (req, res) => {
  try {
    const userId = req.query.userId; // optional filter

    const whereClause = {};
    if (userId) whereClause.UserId = userId;

    const ideas = await User.findAll({
      where: whereClause,
      attributes: ["UserId", "team_name", "email", "mentor_id"],
      include: [
        {
          model: IdeaSelection,
          attributes: [
            "team_name",
            "list_of_ideas",
            "ideas_scores",
            "ideas_avg_score",
            "overall_avg_score",
            "selected_idea",
          ],
          required: false,
        },
      ],
    });

    res.json(ideas);
  } catch (err) {
    console.error("❌ Admin: Error fetching ideas:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =============== ADMIN: Get All SWOTs or Specific User ==================
router.get("/swots", async (req, res) => {
  try {
    const userId = req.query.userId; // optional filter

    const whereClause = {};
    if (userId) whereClause.UserId = userId;

    const swots = await User.findAll({
      where: whereClause,
      attributes: ["UserId", "team_name", "email", "mentor_id"],
      include: [
        {
          model: SwotAnalysis,
          attributes: [
            "selected_idea",
            "strengths",
            "weakness",
            "opportunities",
            "threats",
          ],
          required: false,
        },
      ],
    });

    res.json(swots);
  } catch (err) {
    console.error("❌ Admin: Error fetching SWOTs:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =============== ADMIN: Get All Value Propositions or Specific User ==================
router.get("/value-propositions", async (req, res) => {
  try {
    const userId = req.query.userId; // optional filter

    const whereClause = {};
    if (userId) whereClause.UserId = userId;

    const vps = await User.findAll({
      where: whereClause,
      attributes: ["UserId", "team_name", "email", "mentor_id"],
      include: [
        {
          model: ValueProposition,
          attributes: [
            "gain_creators",
            "gains",
            "products_and_services",
            "customer_jobs",
            "pain_relievers",
            "pains",
            "value_proposition",
            "customer_segment",
          ],
          required: false,
        },
      ],
    });

    res.json(vps);
  } catch (err) {
    console.error("❌ Admin: Error fetching Value Propositions:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// GET all teams with mentor
router.get("/teams", async (req, res) => {
  try {
    const teams = await User.findAll({
      include: [
        { model: Mentor, as: 'mentor' },
        { model: Student }
      ]
    });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// GET all assigned teams
router.get('/assigned-teams', async (req, res) => {
  try {
    const teams = await User.findAll();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all mentors
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await Mentor.findAll();
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all review scores for admin dashboard
router.get('/all-review-scores', async (req, res) => {
  try {
    const semester = req.query.semester || 'sem2';
    const semesterMap = {
      sem1: { review1: 'sem1_review1', review2: 'sem1_review2', workbook: 'sem1_workbook' },
      sem2: { review1: 'sem2_review1', review2: 'sem2_review2', workbook: 'sem2_workbook' },
      sem3: { review1: 'sem3_review1', review2: 'sem3_review2', workbook: 'sem3_workbook' },
      sem4: { review1: 'sem4_review1', review2: 'sem4_review2', workbook: 'sem4_workbook' },
    };

    const selectedSemester = semesterMap[semester] || semesterMap.sem2;

    const teams = await User.findAll({
      attributes: ['UserId', 'team_name'],
      include: [
        {
          model: Student,
          attributes: [
            'student_name',
            'section',
            'register_no',
            'dept',
            'is_leader',
            selectedSemester.review1,
            selectedSemester.review2,
            selectedSemester.workbook,
          ],
          required: false,
        },
      ],
      order: [[Student, 'register_no', 'ASC']],
    });

    const allScores = [];

    teams.forEach((team) => {
      (team.Students || []).forEach((student) => {
        const review1 = Number(student[selectedSemester.review1] ?? 0);
        const review2 = Number(student[selectedSemester.review2] ?? 0);
        const workbook = Number(student[selectedSemester.workbook] ?? 0);
        const total = review1 + review2 + workbook;

        allScores.push({
          teamId: team.UserId,
          team_name: team.team_name,
          name: student.student_name,
          section: student.section,
          register_no: String(student.register_no || ''),
          dept: student.dept,
          is_leader: Boolean(student.is_leader),
          role: student.is_leader ? 'Leader' : 'Student',
          review1score: review1,
          review2score: review2,
          workbook_score: workbook,
          total_score: total,
        });
      });
    });

    allScores.sort((a, b) =>
      String(a.register_no || '').localeCompare(String(b.register_no || ''), undefined, {
        numeric: true,
      })
    );

    res.json(allScores);
  } catch (err) {
    console.error('❌ Admin review scores fetch error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch review scores' });
  }
});

// PUT assign mentor
router.put('/assign-mentor', async (req, res) => {
  const { team_id, mentor_id } = req.body;
  try {
    await User.update({ mentor_id: mentor_id }, { where: { UserId: team_id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all teams' history
router.get('/team-history', async (req, res) => {
  try {
    const teams = await User.findAll({
      include: [
        {
          model: Mentor,
          as: 'mentor',
          attributes: ['name', 'email', 'department']
        },
        {
          model: Student,
          attributes: ['student_name', 'register_no', 'dept', 'is_leader', 'section', 'mobile']
        },
        {
          model: TeamUpload,
          attributes: ['id','week_number', 'file_key', 'uploaded_at', 'createdAt', 'status', 'review_comment']
        },
        {
          model: ProblemStatement,
          attributes: ['id', 'problem_description', 'selected_idea', 'updatedAt']
        }
      ],
      order: [
        ['UserId', 'ASC'], // Optional: Order by team id
        [TeamUpload, 'week_number', 'ASC'] // Optional: Order uploads by week
      ]
    });

    
    // Extend expiry for 2 months (~60 days)
    const signedTeams = await Promise.all(
      teams.map(async (team) => {
        const uploads = await Promise.all(
          team.TeamUploads.map(async (u) => {
            let signedUrl = null;
            if (u.file_key) {
              signedUrl = await getSignedFileUrl(u.file_key, 60 * 24 * 60 * 60); 
              // 60 days in seconds
            }
            return {
              ...u.toJSON(),
              file_url: signedUrl,
            };
          })
        );
        return {
          ...team.toJSON(),
          TeamUploads: uploads,
        };
      })
    );

    // Calculate counts
    let uploadedCount = 0;
    let notUploadedCount = 0;
    signedTeams.forEach((team) => {
      if (team.TeamUploads && team.TeamUploads.length > 0) {
        uploadedCount++;
      } else {
        notUploadedCount++;
      }
    });

    res.json({
      uploadedCount,
      notUploadedCount,
      teams: signedTeams,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/uploads/:uploadId/comment', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { review_comment } = req.body;

    // 1. Get upload + user + mentor
    const upload = await TeamUpload.findByPk(uploadId, {
      include: [
        {
          model: User,
          attributes: ['UserId', 'email', 'mobile', 'team_name', 'mentor_id'],
          include: [{ model: Mentor, as: 'mentor', attributes: ['name', 'email', 'title', 'department'] }]
        }
      ]
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const student = upload.User;    // Team leader
    const mentor = student.mentor;  // Mentor

    if (!mentor) {
      return res.status(400).json({ error: 'No mentor assigned to this team' });
    }

    // 2. Setup email client
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: process.env.EMAIL_USER,
      name: "IPD-TEAM",
    };

    const weekNumber = upload.week_number;
    const fileName = upload.file_name;
    const supabaseUrl = upload.file_url;
//student.email
//mentor.email
console.log(student.email,mentor.email)
    // 3. Send email to Team Leader and Mentor
    await transEmailApi.sendTransacEmail({
      sender,
      to: [
        { email: student.email },   // Team leader
        { email:  mentor.email}     // Mentor
      ],
      subject: `IPD HEAD Comment - File ${weekNumber}`,
      htmlContent: `
        <h3>Hello ${student.team_name},</h3>
        <p>An <strong>IPD Head</strong> has shared a comment on your <strong>File ${weekNumber}</strong> upload.</p>
        
        <p><strong>Comment:</strong></p>
        <blockquote style="background:#f8f9fa; padding:10px; border-left:4px solid #007bff;">
          ${review_comment}
        </blockquote>

        <p>You can also check the file here:</p>
        <p><a href="${supabaseUrl}" target="_blank">View Uploaded File</a></p>

        <p><strong>Team:</strong> ${student.team_name}</p>
        <p><strong>Leader Contact:</strong> ${student.mobile}</p>
        <p><strong>Mentor:</strong> ${mentor.title || ''} ${mentor.name} (${mentor.department})</p>

        <br />
        <p>Best Regards,<br />IPD Team</p>
      `,
      attachment: [
        {
          url: supabaseUrl,
          name: fileName,
        }
      ]
    });

    res.json({ message: 'Admin comment mailed successfully to Team Leader & Mentor' });

  } catch (err) {
    console.error('Error sending admin comment email:', err);
    res.status(500).json({ error: 'Server error sending email' });
  }
});



// Update an existing team and its existing students in one manager action.
router.put('/team-manager', async (req, res) => {
  try {
    const { teamId, team_name, email, mobile, mentor_id, students = [] } = req.body;

    if (!teamId || !team_name || !email || !mobile || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Valid team details and a students array are required' });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const team = await User.findByPk(teamId, { transaction });
      if (!team) {
        const error = new Error('Team not found');
        error.status = 404;
        throw error;
      }

      team.team_name = team_name;
      team.email = email;
      team.mobile = mobile;
      team.mentor_id = mentor_id || null;
      await team.save({ transaction });

      for (const item of students) {
        if (!item.student_name || !item.register_no || !item.dept || !item.section) {
          const error = new Error('Each team member must have a name, register number, department and section');
          error.status = 400;
          throw error;
        }

        if (!item.id) {
          await Student.create({
            user_id: teamId,
            student_name: item.student_name,
            register_no: item.register_no,
            dept: item.dept,
            section: item.section,
            mobile: item.mobile || null,
            is_leader: Boolean(item.is_leader),
          }, { transaction });
          continue;
        }

        const student = await Student.findOne({
          where: { id: item.id, user_id: teamId },
          transaction,
        });
        if (!student) {
          const error = new Error(`Student ${item.id} does not belong to team ${teamId}`);
          error.status = 400;
          throw error;
        }

        const targetTeamId = item.targetTeamId || teamId;
        const targetTeam = targetTeamId === teamId
          ? team
          : await User.findByPk(targetTeamId, { transaction });
        if (!targetTeam) {
          const error = new Error(`Target team ${targetTeamId} was not found`);
          error.status = 404;
          throw error;
        }

        student.student_name = item.student_name;
        student.register_no = item.register_no;
        student.dept = item.dept;
        student.section = item.section;
        student.mobile = item.mobile || null;
        student.is_leader = Boolean(item.is_leader);
        student.user_id = targetTeamId;
        await student.save({ transaction });
      }

      return { team };
    });

    res.json({ success: true, team: result.team });
  } catch (err) {
    console.error('Team manager error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE a team
router.delete('/delete-team/:id', async (req, res) => {
  const teamId = req.params.id;
  try {
    await User.destroy({ where: { UserId: teamId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE a student from a team
router.delete('/delete-student/:teamId/:registerNo', async (req, res) => {
  const { teamId, registerNo } = req.params;
  try {
    const student = await Student.findOne({
      where: {
        user_id: teamId,
        register_no: registerNo
      }
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    await student.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT update student
router.put('/edit-student', async (req, res) => {
  const { teamId, registerNo, student_name, section, dept } = req.body;
  try {
    const student = await Student.findOne({
      where: {
        user_id: teamId,
        register_no: registerNo
      }
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    student.student_name = student_name;
    student.section = section;
    student.dept = dept;

    await student.save();

    res.json({ success: true, updatedStudent: student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lock a team (disable uploads)
router.post("/teams/:teamId/lock", async (req, res) => {
  try {
    const { teamId } = req.params;
    await User.update({ isLocked: true }, { where: { UserId: teamId } });
    res.json({ message: `Team ${teamId} locked successfully` });
  } catch (err) {
    console.error("Error locking team:", err);
    res.status(500).json({ error: "Failed to lock team" });
  }
});

// Unlock a team (enable uploads)
router.post("/teams/:teamId/unlock", async (req, res) => {
  try {
    const { teamId } = req.params;
    await User.update({ isLocked: false }, { where: { UserId: teamId } });
    res.json({ message: `Team ${teamId} unlocked successfully` });
  } catch (err) {
    console.error("Error unlocking team:", err);
    res.status(500).json({ error: "Failed to unlock team" });
  }
});

// Batch lock all teams in a batch prefix (e.g., "24IPD" or "25IPD")
router.post("/teams/batch/lock", async (req, res) => {
  try {
    const { batch } = req.body;
    if (!batch) return res.status(400).json({ error: "batch is required" });
    const prefix = `${batch.toString().toUpperCase()}-`;
    const [updated] = await User.update(
      { isLocked: true },
      { where: { UserId: { [Op.like]: `${prefix}%` } } }
    );
    res.json({ message: `Batch ${batch}: ${updated} teams locked` });
  } catch (err) {
    console.error("Error batch-locking teams:", err);
    res.status(500).json({ error: "Failed to batch-lock teams" });
  }
});

router.post("/teams/batch/unlock", async (req, res) => {
  try {
    const { batch } = req.body;
    if (!batch) return res.status(400).json({ error: "batch is required" });
    const prefix = `${batch.toString().toUpperCase()}-`;
    const [updated] = await User.update(
      { isLocked: false },
      { where: { UserId: { [Op.like]: `${prefix}%` } } }
    );
    res.json({ message: `Batch ${batch}: ${updated} teams unlocked` });
  } catch (err) {
    console.error("Error batch-unlocking teams:", err);
    res.status(500).json({ error: "Failed to batch-unlock teams" });
  }
});

// =============== ADMIN: Get All Review Scores with Team & Student Details ==================



export default router;