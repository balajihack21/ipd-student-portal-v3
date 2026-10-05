import express from 'express';
import { Op } from 'sequelize';
import authenticate from '../middleware/authenticate.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js'
import Student from '../models/Student.js'
import TeamUpload from '../models/TeamUpload.js';
import UserRequirementCanvas from "../models/UserRequirementCanvas.js";
import ProductDimensions from "../models/ProductDimensions.js";
import PerformanceRequirement from "../models/PerformanceRequirement.js";
import BillOfMaterial from "../models/BillOfMaterial.js";
import dotenv from 'dotenv';
import Sib from 'sib-api-v3-sdk';
import { getSignedFileUrl } from "../backblaze.js";
import { uploadToBackblaze } from "../middleware/upload.js";
import xlsx from 'xlsx';

const router = express.Router();

/**
 * GET Assigned Teams + their uploads
 */

router.get("/teams/dropdown", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { batch } = req.query;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators allowed" });
    }

    const userWhere = {};
    if (batch === "24ipd" || batch === "25ipd") {
      userWhere.UserId = { [Op.like]: `${batch}%` };
    }

    const teams = await User.findAll({
      attributes: ["UserId", "team_name"],
      where: userWhere,
      include: [
        {
          model: Student,
          attributes: [],
          where: { dept: mentor.department, is_leader: true },
          required: true
        }
      ]
    });

    res.json(teams);
  } catch (err) {
    console.error("Error fetching dropdown teams:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/teams/:teamId/students", authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const students = await Student.findAll({
      where: { user_id: teamId },
      attributes: [
        "id", "student_name", "register_no", "dept", "section",
        "sem1_review1", "sem1_review2",
        "sem2_review1", "sem2_review2",
        "sem3_review1", "sem3_review2",
        "sem4_review1", "sem4_review2"
      ],
      order: [["student_name", "ASC"]]
    });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.post("/teams/:teamId/sem3-review1", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId } = req.params;
    const { students } = req.body;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators allowed" });
    }
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: "Students data invalid" });
    }
    for (const s of students) {
      await Student.update(
        { sem3_review1: s.mark },
        { where: { id: s.id, user_id: teamId } }
      );
    }
    res.json({ message: "Sem 3 Review 1 marks updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update marks" });
  }
});

router.post("/teams/:teamId/sem1-review1", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId } = req.params;
    const { students } = req.body;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators allowed" });
    }
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: "Students data invalid" });
    }
    for (const s of students) {
      await Student.update(
        { sem1_review1: s.mark },
        { where: { id: s.id, user_id: teamId } }
      );
    }
    res.json({ message: "Sem 1 Review 1 marks updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update marks" });
  }
});

router.post("/teams/:teamId/sem2-review1", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId } = req.params;
    const { students } = req.body;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators allowed" });
    }

    if (!Array.isArray(students)) {
      return res.status(400).json({ error: "طلاب data invalid" });
    }

    for (const s of students) {
      await Student.update(
        { sem2_review1: s.mark },
        { where: { id: s.id, user_id: teamId } }
      );
    }

    res.json({ message: "Marks updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update marks" });
  }
});


router.post("/teams/:teamId/sem2-review2", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId } = req.params;
    const { students } = req.body;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators allowed" });
    }

    if (!Array.isArray(students)) {
      return res.status(400).json({ error: "Students data invalid" });
    }

    for (const s of students) {
      await Student.update(
        { sem2_review2: s.mark },   // ✅ CHANGE FIELD
        { where: { id: s.id, user_id: teamId } }
      );
    }

    res.json({ message: "Review 2 marks updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update marks" });
  }
});

router.post("/teams/:teamId/sem1-review2", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId } = req.params;
    const { students } = req.body;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators allowed" });
    }
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: "Students data invalid" });
    }
    for (const s of students) {
      await Student.update(
        { sem1_review2: s.mark },
        { where: { id: s.id, user_id: teamId } }
      );
    }
    res.json({ message: "Sem 1 Review 2 marks updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update marks" });
  }
});

router.post("/teams/:teamId/sem3-review2", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId } = req.params;
    const { students } = req.body;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators allowed" });
    }
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: "Students data invalid" });
    }
    for (const s of students) {
      await Student.update(
        { sem3_review2: s.mark },
        { where: { id: s.id, user_id: teamId } }
      );
    }
    res.json({ message: "Sem 3 Review 2 marks updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update marks" });
  }
});

router.post("/teams/:teamId/sem4-review1", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId } = req.params;
    const { students } = req.body;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators allowed" });
    }
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: "Students data invalid" });
    }
    for (const s of students) {
      await Student.update(
        { sem4_review1: s.mark },
        { where: { id: s.id, user_id: teamId } }
      );
    }
    res.json({ message: "Sem 4 Review 1 marks updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update marks" });
  }
});

router.post("/teams/:teamId/sem4-review2", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId } = req.params;
    const { students } = req.body;

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators allowed" });
    }
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: "Students data invalid" });
    }
    for (const s of students) {
      await Student.update(
        { sem4_review2: s.mark },
        { where: { id: s.id, user_id: teamId } }
      );
    }
    res.json({ message: "Sem 4 Review 2 marks updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update marks" });
  }
});

router.get('/teams', authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId; // From JWT

    // Fetch mentor details
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Check if the logged-in user is a coordinator
    if (!mentor.is_coordinator) {
      return res.status(403).json({ error: 'Access denied. Only coordinators can view all teams.' });
    }

    // Fetch all teams belonging to the same department as the coordinator
    const teams = await User.findAll({
      attributes: ['UserId', 'team_name', 'email', 'mobile'],
      include: [
        {
          model: Student,
          attributes: ['student_name', 'dept', 'section', 'register_no', 'mobile'],
          where: {
            is_leader: true,
            dept: mentor.department // Filter by coordinator’s department
          },
          required: true
        }
      ]
    });

    res.json(teams);
  } catch (err) {
    console.error('Error fetching department teams:', err);
    res.status(500).json({ error: 'Server error fetching teams' });
  }
});




router.post("/teams/:teamId/rubrics/:stage", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId, stage } = req.params;
    const { scores } = req.body;

    if (!scores || typeof scores !== "object") {
      return res.status(400).json({ error: "Scores are required" });
    }

    // Check mentor role
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators can submit rubrics" });
    }

    // Ensure team exists
    const team = await User.findByPk(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    // ✅ Determine rubric range by stage
    let startIndex, endIndex;
    if (stage === "review1") {
      const total = Object.values(scores).reduce((a, b) => a + b, 0);

      await team.update({
        rubric1: scores.rubric1,
        rubric2: scores.rubric2,
        rubric3: scores.rubric3,
        rubric4: scores.rubric4,
        rubric5: scores.rubric5,
        review1_score: total
      });
    } else if (stage === "review2") {
      const total = Object.values(scores).reduce((a, b) => a + b, 0);

      await team.update({
        rubric6: scores.rubric6,
        rubric7: scores.rubric7,
        rubric8: scores.rubric8,
        rubric9: scores.rubric9,
        rubric10: scores.rubric10,
        review2_score: total
      });
    }
    else {
      return res.status(400).json({ error: "Invalid review stage" });
    }

    // ✅ Extract only relevant rubrics
    const rubricFields = {};
    for (let i = startIndex; i <= endIndex; i++) {
      const key = `rubric${i}`;
      if (scores[key] !== undefined) {
        rubricFields[key] = scores[key];
      }
    }

    await User.update(rubricFields, { where: { UserId: teamId } });

    res.json({ message: `Rubrics for ${stage} submitted successfully`, updated: rubricFields });
  } catch (err) {
    console.error("Error submitting rubrics:", err);
    res.status(500).json({ error: "Failed to submit rubrics" });
  }
});





// ✅ /my-teams route
// router.get('/my-teams', authenticate, async (req, res) => {
//   try {
//     const mentorId = req.user.mentorId; // from JWT/session
//     console.log("Mentor:", req.user);

//     // Find all students/teams assigned to this mentor
//     const teams = await User.findAll({
//       where: { mentor_id: mentorId },
//       attributes: ['UserId', 'team_name', 'email', 'mobile'],
//       include: [
//         {
//           model: TeamUpload,
//           attributes: [
//             'id',
//             'file_key',   // we need file_key to generate signed URL
//             'week_number',
//             'uploaded_at',
//             'status',
//             'review_comment'
//           ],
//           order: [['uploaded_at', 'DESC']]
//         }
//       ]
//     });

//     // Replace file_url with signed URL
//     const signedTeams = await Promise.all(
//       teams.map(async (team) => {
//         const uploads = await Promise.all(
//           team.TeamUploads.map(async (upload) => {
//             let signedUrl = null;
//             if (upload.file_key) {
//               signedUrl = await getSignedFileUrl(upload.file_key); // 7 days max
//             }
//             return {
//               ...upload.toJSON(),
//               file_url: signedUrl, // replace with signed URL
//             };
//           })
//         );

//         return {
//           ...team.toJSON(),
//           TeamUploads: uploads,
//         };
//       })
//     );

//     res.json(signedTeams);

//   } catch (err) {
//     console.error('Error fetching assigned teams:', err);
//     res.status(500).json({ error: 'Server error fetching teams' });
//   }
// });
// import { Op } from "sequelize";


import IdeaSelection from "../models/Idea.js";
import SwotAnalysis from "../models/Swot.js";
import ValueProposition from "../models/Value.js";
// import { getSignedFileUrl } from "../utils/s3.js"; // adjust if needed





router.get("/my-teams", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { batch } = req.query;

    console.log("👨‍🏫 Mentor:", req.user);
    console.log("📚 Batch:", batch);

    // ---------------------------------------------------------
    // BATCH FILTER
    // ---------------------------------------------------------
    // 24ipd -> UserId starts with 24ipd
    // 25ipd -> UserId starts with 25ipd
    //
    // If no batch is selected, no batch filter is applied.
    // ---------------------------------------------------------

    const userWhere = {
      mentor_id: mentorId
    };

    if (batch === "24ipd" || batch === "25ipd") {
      userWhere.UserId = {
        [Op.like]: `${batch}%`
      };
    }


    // ✅ Fetch all students under this mentor (with related data)
    const teams = await User.findAll({
      where: userWhere,

      attributes: ["UserId", "team_name", "email", "mobile"],

      include: [
        {
          model: TeamUpload,
          attributes: [
            "id",
            "file_key",
            "week_number",
            "uploaded_at",
            "status",
            "review_comment",
          ],
          required: false,
        },

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

        UserRequirementCanvas,
        ProductDimensions,
        PerformanceRequirement,
        BillOfMaterial
      ],

      order: [[TeamUpload, "uploaded_at", "DESC"]],
    });


    // ✅ Add signed URLs for TeamUploads
    const finalTeams = await Promise.all(
      teams.map(async (team) => {

        const teamData = team.toJSON();

        const uploads = await Promise.all(
          (teamData.TeamUploads || []).map(async (upload) => {

            let signedUrl = null;

            if (upload.file_key) {
              signedUrl = await getSignedFileUrl(upload.file_key);
            }

            return {
              ...upload,
              file_url: signedUrl
            };

          })
        );

        return {
          ...teamData,
          TeamUploads: uploads,
        };

      })
    );


    res.json(finalTeams);

  } catch (err) {

    console.error("❌ Error fetching assigned teams:", err);

    res.status(500).json({
      error: "Server error fetching teams"
    });

  }
});



// GET ideas for mentor's teams or a specific team
router.get("/ideas", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const userId = req.query.userId; // optional

    const whereClause = { mentor_id: mentorId };
    if (userId) whereClause.UserId = userId;

    const ideas = await User.findAll({
      where: whereClause,
      attributes: ["UserId", "team_name", "email"],
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
    console.error("Error fetching mentor ideas:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET SWOT for mentor's teams or a specific team
router.get("/swots", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const userId = req.query.userId; // optional

    const whereClause = { mentor_id: mentorId };
    if (userId) whereClause.UserId = userId;

    const swots = await User.findAll({
      where: whereClause,
      attributes: ["UserId", "team_name", "email"],
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
    console.error("Error fetching mentor SWOTs:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET Value Propositions for mentor's teams or a specific team
router.get("/value-propositions", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const userId = req.query.userId; // optional

    const whereClause = { mentor_id: mentorId };
    if (userId) whereClause.UserId = userId;

    const vps = await User.findAll({
      where: whereClause,
      attributes: ["UserId", "team_name", "email"],
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
    console.error("Error fetching mentor Value Propositions:", err);
    res.status(500).json({ error: "Server error" });
  }
});






// router.get("/teams", authenticate, async (req, res) => {
//   try {
//     const { department } = req.query;

//     if (!department) {
//       return res.status(400).json({ error: "Department is required" });
//     }

//     // Find teams in that department
//     const teams = await User.findAll({
//       include: [
//         {
//           model: Mentor,
//           as: "mentor",
//           attributes: ["mentorId", "name", "department"]
//         }
//       ],
//       where: {},
//     });

//     // Filter users (teams) that map to given department
//     const filteredTeams = teams.filter(
//       (t) => t.mentor && t.mentor.department === department
//     );

//     res.json(filteredTeams);
//   } catch (err) {
//     console.error("Error fetching teams:", err);
//     res.status(500).json({ error: "Failed to fetch teams" });
//   }
// });

/**
 * POST Add/Update review comment
 */
router.post('/uploads/:uploadId/review', authenticate, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { review_comment } = req.body;
    const mentorId = req.user.mentorId;

    // 1. Get mentor details
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // 2. Get upload + student details
    const upload = await TeamUpload.findByPk(uploadId, {
      include: [
        { model: User, attributes: ['UserId', 'email', 'mobile', 'team_name', 'mentor_id'] }
      ]
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const student = upload.User; // The uploader (team leader/student)

    // 3. Authorization check
    if (student.mentor_id !== mentorId) {
      return res.status(403).json({ error: 'Not authorized to review this upload' });
    }

    // 4. Save review
    upload.review_comment = review_comment;
    upload.status = 'REVIEWED';
    await upload.save();

    const weekNumber = upload.week_number;
    const fileName = upload.file_name;
    const supabaseUrl = upload.file_url;

    // 5. Send email to student
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: process.env.EMAIL_USER,
      name: "IPD-TEAM",
    };
    //student.email
    await transEmailApi.sendTransacEmail({
      sender,
      to: [{ email: student.email }],
      subject: `Review Submitted by ${mentor.title}${mentor.name} - File ${weekNumber}`,
      htmlContent: `
        <h3>Hello ${student.team_name},</h3>
        <p>Your mentor <strong>${mentor.title}${mentor.name}</strong> has submitted a review for your <strong>File ${weekNumber}</strong> upload.</p>
        <p><strong>Review Comments:</strong></p>
        <blockquote style="background:#f8f9fa; padding:10px; border-left:4px solid #007bff;">
          ${review_comment}
        </blockquote>
        <p>You can also view the review from your dashboard:</p>
        <p><a href="https://agni-ipd.onrender.com/" target="_blank">Go to IPD Dashboard</a></p>
        <p>Team Name: <strong>${student.team_name}</strong></p>
        <p>Contact No: <strong>${student.mobile}</strong></p>
        <br />
        <p>Best Regards,<br />IPD Team</p>
      `
    });

    res.json({ message: 'Review saved and email sent successfully', upload });

  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ error: 'Server error saving review' });
  }
});





/**
 * GET Mentor Details
 */
router.get('/details', authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId; // from JWT/session

    const mentor = await Mentor.findByPk(mentorId, {
      attributes: ['MentorId', 'name', 'email', 'title', 'department', 'is_coordinator', 'designation'] // add fields as needed
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    res.json(mentor);
  } catch (err) {
    console.error('Error fetching mentor details:', err);
    res.status(500).json({ error: 'Server error fetching mentor details' });
  }
});


import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Upload Excel (Only for Coordinators)
 */


/**
 * Upload Excel (Only for Coordinators)
 */
router.post("/upload-excel", authenticate, upload.single("file"), async (req, res) => {
  try {
    const mentorId = req.user.mentorId;

    // ✅ check coordinator
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators can upload Excel" });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: "File is required" });

    const fileName = file.originalname;
    const mimeType = file.mimetype;

    // ✅ Upload to Backblaze → returns { key, signedUrl }
    const { key: fileKey, signedUrl } = await uploadToBackblaze(
      file.buffer,
      fileName,
      mimeType
    );

    // ✅ Save in Mentor table
    mentor.file_key = fileKey;   // permanent reference
    mentor.file_url = signedUrl; // temporary signed URL
    await mentor.save();

    // Inside your upload route
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const sheetJson = xlsx.utils.sheet_to_json(sheet, {
      defval: null,
      header: 1, // raw array of rows
    });

    // 1️⃣ Find header row dynamically
    const headerIndex = sheetJson.findIndex(r =>
      r.some(c => typeof c === "string" && c.toLowerCase().includes("team id"))
    );

    if (headerIndex === -1) {
      throw new Error("❌ Could not find header row in Excel");
    }

    // 2️⃣ Normalize headers
    const headerRow = sheetJson[headerIndex].map(h =>
      h ? h.toString().replace(/\s+/g, " ").trim() : ""
    );

    // 3️⃣ Extract all student rows (till end of sheet)
    const dataRows = sheetJson.slice(headerIndex + 1);

    const rows = dataRows.map(r => {
      const obj = {};
      headerRow.forEach((key, i) => {
        obj[key] = r[i] ?? null;
      });
      return obj;
    });

    // Debug
    console.log("✅ Normalized headers:", headerRow);
    console.log("✅ First student row:", rows[0]);
    let lastTeamId = null; // keep track of last seen team ID
    let lastTeamName = null;

    for (const row of rows) {
      let teamId = row["Team ID"]?.toString().trim();
      let teamName = row["Team Name"]?.toString().trim();
      const registerNo = row["Register No"]?.toString().trim();
      const studentName = row["Student Name"]?.toString().trim();

      // If empty → use last seen
      if (!teamId && lastTeamId) {
        teamId = lastTeamId;
      }
      if (!teamName && lastTeamName) {
        teamName = lastTeamName;
      }

      // Skip if still missing
      if (!teamId || !registerNo || !studentName) continue;

      // Remember for next iteration
      lastTeamId = teamId;
      lastTeamName = teamName;

      // Find team/user
      const user = await User.findOne({ where: { UserId: teamId } });
      if (!user) {
        console.warn(`⚠️ No user found for Team ID: ${teamId}`);
        continue;
      }

      // Find student
      const student = await Student.findOne({
        where: { register_no: registerNo, user_id: user.UserId },
      });

      if (!student) {
        console.warn(`⚠️ No student found with RegNo: ${registerNo}, TeamID: ${teamId}`);
        continue;
      }

      // Update rubrics
      await student.update({
        rubric1: row["Problem Identification(4)"] || null,
        rubric2: row["Problem Statement Canvas (4)"] || null,
        rubric3: row["Idea Generation & Affinity diagram (4)"] || null,
        rubric4: row["Team Presentation & Clarity(4)"] || null,
        rubric5: row["Mentor Interaction & Progress Tracking (4)"] || null,
        review1_score: row["Total Marks (20)"] || null,
      });

      console.log(`✅ Updated student ${studentName} (${registerNo}) in Team ${teamId}`);
    }

    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: process.env.EMAIL_USER,
      name: "IPD-TEAM",
    };
    //student.email
    await transEmailApi.sendTransacEmail({
      sender,
      to: [{ email: "mailztobalaji@gmail.com" }],
      subject: `Review Submitted by ${mentor.title}${mentor.name}`,
      htmlContent: `
        <h3>Hello Balaji,</h3>
        <p>Best Regards,<br />IPD Team</p>
      `,
      attachment: [
        {
          url: signedUrl, // link to uploaded file
          name: fileName,
        },
      ],
    });

    // 5️⃣ Response
    res.json({
      message: "Excel uploaded and students/rubrics processed successfully",
      file_key: fileKey,
      file_url: signedUrl,
      processed_rows: rows.length,
    });


  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload Excel", details: err.message });
  }
});

// GET: Fetch all workbook scores for coordinator's department
router.get("/workbook-scores", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const mentor = await Mentor.findByPk(mentorId);

    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators can view workbook scores" });
    }

    const teams = await User.findAll({
      attributes: ["UserId", "team_name"],
      include: [
        {
          model: Student,
          attributes: ["sem1_workbook", "sem2_workbook", "sem3_workbook", "sem4_workbook", "dept", "section"],
          where: {
            is_leader: true,
            dept: mentor.department
          },
          required: true
        }
      ]
    });

    res.json(teams);
  } catch (err) {
    console.error("Error fetching workbook scores:", err);
    res.status(500).json({ error: "Server error fetching workbook scores" });
  }
});


router.post("/workbook-score", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const { teamId, score, semester } = req.body;

    // Validate coordinator
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators can assign workbook scores" });
    }

    // Validate input
    if (!teamId || score == null) {
      return res.status(400).json({ error: "teamId and score are required" });
    }

    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 40) {
      return res.status(400).json({ error: "Score must be between 0 and 40" });
    }

    // Determine which workbook column to update based on semester
    const semKey = (semester || "sem2").toString().toLowerCase();
    const fieldMap = {
      sem1: "sem1_workbook",
      sem2: "sem2_workbook",
      sem3: "sem3_workbook",
      sem4: "sem4_workbook",
    };
    const updateField = fieldMap[semKey] || "sem2_workbook";

    // Check if team exists
    const team = await User.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Update all students in that team
    const [updatedCount] = await Student.update(
      { [updateField]: numericScore },
      { where: { user_id: teamId } }
    );

    res.json({
      message: `Workbook score ${numericScore} assigned successfully to ${updatedCount} students of team ${team.team_name}`,
      teamId,
      semester: semKey,
      workbook_score: numericScore
    });

  } catch (err) {
    console.error("Error updating workbook score:", err);
    res.status(500).json({ error: "Server error while updating workbook score" });
  }
});





/**
 * Get Mentor Upload
 */
// router.post("/upload-excel", authenticate, upload.single("file"), async (req, res) => {
//   try {
//     const mentorId = req.user.mentorId;

//     // ✅ Only coordinators can upload Excel
//     const mentor = await Mentor.findByPk(mentorId);
//     if (!mentor || !mentor.is_coordinator) {
//       return res.status(403).json({ error: "Only coordinators can upload Excel" });
//     }

//     const file = req.file;
//     if (!file) return res.status(400).json({ error: "File is required" });

//     const fileName = file.originalname;
//     const mimeType = file.mimetype;

//     // ✅ Upload to Backblaze
//     const { key: fileKey, signedUrl } = await uploadToBackblaze(file.buffer, fileName, mimeType);

//     mentor.file_key = fileKey;
//     mentor.file_url = signedUrl;
//     await mentor.save();

//     // ✅ Read Excel
//     const workbook = xlsx.read(file.buffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const sheetJson = xlsx.utils.sheet_to_json(sheet, { defval: null, header: 1 });

//     // 1️⃣ Find header row
//     const headerIndex = sheetJson.findIndex(r =>
//       r.some(c => typeof c === "string" && c.toLowerCase().includes("team id"))
//     );

//     if (headerIndex === -1) {
//       throw new Error("❌ Could not find header row in Excel");
//     }

//     // 2️⃣ Normalize headers
//     const headerRow = sheetJson[headerIndex].map(h =>
//       h ? h.toString().replace(/\s+/g, " ").trim() : ""
//     );
//     const normalizedHeaders = headerRow.map(h => h.toLowerCase().trim());

//     // 3️⃣ Identify review type
//     const isReview1 =
//       normalizedHeaders.includes("problem identification(4)") ||
//       normalizedHeaders.includes("problem statement canvas (4)");

//     const isReview2 =
//       normalizedHeaders.includes("idea selection canvas(4)") ||
//       normalizedHeaders.includes("swot analysis(4)");

//     console.log("Detected review type:", isReview1 ? "Review 1" : isReview2 ? "Review 2" : "Unknown");

//     // 4️⃣ Extract data rows
//     const dataRows = sheetJson.slice(headerIndex + 1);
//     const rows = dataRows.map(r => {
//       const obj = {};
//       headerRow.forEach((key, i) => {
//         obj[key] = r[i] ?? null;
//       });
//       return obj;
//     });

//     let lastTeamId = null;
//     let lastTeamName = null;

//     for (const row of rows) {
//       let teamId = row["Team ID"]?.toString().trim();
//       let teamName = row["Team Name"]?.toString().trim();
//       const registerNo = row["Register No"]?.toString().trim();
//       const studentName = row["Student Name"]?.toString().trim();

//       if (!teamId && lastTeamId) teamId = lastTeamId;
//       if (!teamName && lastTeamName) teamName = lastTeamName;
//       if (!teamId || !registerNo || !studentName) continue;

//       lastTeamId = teamId;
//       lastTeamName = teamName;

//       // Find the team
//       const user = await User.findOne({ where: { UserId: teamId } });
//       if (!user) {
//         console.warn(`⚠️ No user found for Team ID: ${teamId}`);
//         continue;
//       }

//       // Find the student
//       const student = await Student.findOne({
//         where: { register_no: registerNo, user_id: user.UserId },
//       });
//       if (!student) {
//         console.warn(`⚠️ No student found with RegNo: ${registerNo}, TeamID: ${teamId}`);
//         continue;
//       }

//       // 🧩 REVIEW 1 UPDATE
//       if (isReview1 && !isReview2) {
//         await student.update({
//           ...(row["Problem Identification(4)"] && { rubric1: row["Problem Identification(4)"] }),
//           ...(row["Problem Statement Canvas (4)"] && { rubric2: row["Problem Statement Canvas (4)"] }),
//           ...(row["Idea Generation & Affinity diagram (4)"] && { rubric3: row["Idea Generation & Affinity diagram (4)"] }),
//           ...(row["Team Presentation & Clarity(4)"] && { rubric4: row["Team Presentation & Clarity(4)"] }),
//           ...(row["Mentor Interaction & Progress Tracking (4)"] && { rubric5: row["Mentor Interaction & Progress Tracking (4)"] }),
//           ...(row["Total Marks (20)"] && { review1_score: row["Total Marks (20)"] }),
//         });
//         console.log(`✅ [Review 1] Updated student ${studentName} (${registerNo})`);
//       }

//       // 🧩 REVIEW 2 UPDATE
//       else if (isReview2 && !isReview1) {
//         await student.update({
//           ...(row["Idea Selection Canvas(4)"] && { rubric6: row["Idea Selection Canvas(4)"] }),
//           ...(row["SWOT Analysis(4)"] && { rubric7: row["SWOT Analysis(4)"] }),
//           ...(row["Value Proposition Canvas(4)"] && { rubric8: row["Value Proposition Canvas(4)"] }),
//           ...(row["Progress Tracking(4)"] && { rubric9: row["Progress Tracking(4)"] }),
//           ...(row["Presentation & Communication (4)"] && { rubric10: row["Presentation & Communication (4)"] }),
//           ...(row["Total Marks(20)"] && { review2_score: row["Total Marks(20)"] }),
//         });
//         console.log(`✅ [Review 2] Updated student ${studentName} (${registerNo})`);
//       }

//       // ❌ Unknown review type
//       else {
//         console.warn("⚠️ Unknown review type — skipping row");
//       }
//     }

//     // ✅ Send confirmation email
//     const client = Sib.ApiClient.instance;
//     const apiKey = client.authentications["api-key"];
//     apiKey.apiKey = process.env.EMAIL_PASSWORD;

//     const transEmailApi = new Sib.TransactionalEmailsApi();
//     const sender = { email: process.env.EMAIL_USER, name: "IPD-TEAM" };

//     await transEmailApi.sendTransacEmail({
//       sender,
//       to: [{ email: "mailztobalaji@gmail.com" }],
//       subject: `Review Sheet Uploaded by ${mentor.title || ""} ${mentor.name}`,
//       htmlContent: `
//         <h3>Hello Balaji,</h3>
//         <p>The file <b>${fileName}</b> has been processed successfully.</p>
//         <p>Detected Review Type: <b>${isReview1 ? "Review 1" : isReview2 ? "Review 2" : "Unknown"}</b></p>
//         <p>Best Regards,<br />IPD Team</p>
//       `,
//       attachment: [{ url: signedUrl, name: fileName }],
//     });

//     res.json({
//       message: "Excel uploaded and students/rubrics processed successfully",
//       review_type: isReview1 ? "Review 1" : isReview2 ? "Review 2" : "Unknown",
//       file_key: fileKey,
//       file_url: signedUrl,
//       processed_rows: rows.length,
//     });

//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ error: "Failed to upload Excel", details: err.message });
//   }
// });





// --- REVIEW 1 ---
router.post("/upload-review1", authenticate, upload.single("file"), async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const mentor = await Mentor.findByPk(mentorId);

    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators can upload Review 1 Excel" });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: "File is required" });

    const fileName = file.originalname;
    const mimeType = file.mimetype;

    // ✅ Upload file to Backblaze
    const { key: fileKey, signedUrl } = await uploadToBackblaze(file.buffer, fileName, mimeType);
    mentor.review1_file_key = fileKey;
    mentor.review1_file_url = signedUrl;
    await mentor.save();

    // 🔹 Send email immediately after upload
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = { email: process.env.EMAIL_USER, name: "IPD-TEAM" };

    await transEmailApi.sendTransacEmail({
      sender,
      to: [{ email: "mailztobalaji@gmail.com" }],
      subject: `Review 1 File Uploaded by ${mentor.title || ""} ${mentor.name}`,
      htmlContent: `
        <h3>Hello Balaji,</h3>
        <p>The Review 1 file <b>${fileName}</b> has been uploaded successfully.</p>
        <p>Best Regards,<br />IPD Team</p>
      `,
      attachment: [{ url: signedUrl, name: fileName }],
    });

    // ✅ Read Excel & update students
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const sheetJson = xlsx.utils.sheet_to_json(sheet, { defval: null, header: 1 });

    const headerIndex = sheetJson.findIndex(r =>
      r.some(c => typeof c === "string" && c.toLowerCase().includes("team id"))
    );
    if (headerIndex === -1) throw new Error("Header row not found");

    const headerRow = sheetJson[headerIndex].map(h => h?.toString().trim() || "");
    const dataRows = sheetJson.slice(headerIndex + 1);

    let lastTeamId = null;

    for (const r of dataRows) {
      const row = {};
      headerRow.forEach((h, i) => (row[h] = r[i] ?? null));

      let teamId = row["Team ID"]?.toString().trim() || lastTeamId;
      const registerNo = row["Register No"]?.toString().trim();
      const studentName = row["Student Name"]?.toString().trim();

      if (!teamId || !registerNo) continue;
      lastTeamId = teamId;

      const user = await User.findOne({ where: { UserId: teamId } });
      if (!user) continue;

      const student = await Student.findOne({
        where: { register_no: registerNo, user_id: user.UserId },
      });
      if (!student) continue;

      await student.update({
        ...(row["Problem Identification(4)"] && { rubric1: row["Problem Identification(4)"] }),
        ...(row["Problem Statement Canvas (4)"] && { rubric2: row["Problem Statement Canvas (4)"] }),
        ...(row["Idea Generation & Affinity diagram (4)"] && { rubric3: row["Idea Generation & Affinity diagram (4)"] }),
        ...(row["Team Presentation & Clarity(4)"] && { rubric4: row["Team Presentation & Clarity(4)"] }),
        ...(row["Mentor Interaction & Progress Tracking (4)"] && { rubric5: row["Mentor Interaction & Progress Tracking (4)"] }),
        ...(row["Total Marks (20)"] && { review1_score: row["Total Marks (20)"] }),
      });

      console.log(`✅ [Review 1] Updated student ${studentName} (${registerNo})`);
    }

    res.json({
      message: "Review 1 Excel processed successfully",
      review_type: "Review 1",
      file_key: fileKey,
      file_url: signedUrl,
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload Review 1 Excel", details: err.message });
  }
});

// --- REVIEW 2 ---
router.post("/upload-review2", authenticate, upload.single("file"), async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const mentor = await Mentor.findByPk(mentorId);

    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({ error: "Only coordinators can upload Review 2 Excel" });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: "File is required" });

    const fileName = file.originalname;
    const mimeType = file.mimetype;

    // ✅ Upload file to Backblaze
    const { key: fileKey, signedUrl } = await uploadToBackblaze(file.buffer, fileName, mimeType);
    mentor.review2_file_key = fileKey;
    mentor.review2_file_url = signedUrl;
    await mentor.save();

    // 🔹 Send email immediately after upload
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = { email: process.env.EMAIL_USER, name: "IPD-TEAM" };

    await transEmailApi.sendTransacEmail({
      sender,
      to: [{ email: "mailztobalaji@gmail.com" }],
      subject: `Review 2 File Uploaded by ${mentor.title || ""} ${mentor.name}`,
      htmlContent: `
        <h3>Hello Balaji,</h3>
        <p>The Review 2 file <b>${fileName}</b> has been uploaded successfully.</p>
        <p>Best Regards,<br />IPD Team</p>
      `,
      attachment: [{ url: signedUrl, name: fileName }],
    });

    // ✅ Normalize headers & update students
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const sheetJson = xlsx.utils.sheet_to_json(sheet, { defval: null, header: 1 });

    const headerIndex = sheetJson.findIndex(r =>
      r.some(c => typeof c === "string" && c.toLowerCase().includes("team id"))
    );
    if (headerIndex === -1) throw new Error("Header row not found");

    const headerRow = sheetJson[headerIndex].map(h =>
      h?.toString().replace(/\s+/g, " ").replace(/["'\r\n]+/g, "").trim()
    );

    const dataRows = sheetJson.slice(headerIndex + 1);
    let lastTeamId = null;

    for (const r of dataRows) {
      const row = {};
      headerRow.forEach((h, i) => (row[h] = r[i] ?? null));

      let teamId = row["Team ID"]?.toString().trim() || lastTeamId;
      const registerNo = row["Register No"]?.toString().trim();
      const studentName = row["Student Name"]?.toString().trim();

      if (!teamId || !registerNo) continue;
      lastTeamId = teamId;

      const user = await User.findOne({ where: { UserId: teamId } });
      if (!user) continue;

      const student = await Student.findOne({
        where: { register_no: registerNo, user_id: user.UserId },
      });
      if (!student) continue;

      await student.update({
        rubric6: row["Idea Selection Canvas(4)"] ?? null,
        rubric7: row["SWOT Analysis(4)"] ?? row["SWOT Analysis (4)"] ?? null,
        rubric8: row["Value Proposition Canvas(4)"] ?? null,
        rubric9: row["Progress Tracking(4)"] ?? null,
        rubric10: row["Presentation & Communication (4)"] ?? null,
        review2_score: row["Total Marks(20)"] ?? row["Total Marks (20)"] ?? null,
      });

      console.log(`✅ [Review 2] Updated student ${studentName} (${registerNo})`);
    }

    res.json({
      message: "Review 2 Excel processed successfully",
      review_type: "Review 2",
      file_key: fileKey,
      file_url: signedUrl,
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload Review 2 Excel", details: err.message });
  }
});


router.get("/my-upload", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;
    const mentor = await Mentor.findByPk(mentorId);

    if (!mentor || !mentor.file_key) {
      return res.json({ message: "No file uploaded yet" });
    }

    // replace permanent key → signed url
    const signedUrl = await getSignedFileUrl(mentor.file_key);

    res.json({
      file_name: mentor.file_key.split("/").pop(),
      file_url: signedUrl,
      uploaded_at: mentor.updatedAt,
    });
  } catch (err) {
    console.error("Error fetching upload:", err);
    res.status(500).json({ error: "Failed to fetch mentor upload" });
  }
});

router.get("/all-review-scores", authenticate, async (req, res) => {
  try {
    const mentorId = req.user.mentorId;

    // ✅ Check coordinator
    const mentor = await Mentor.findByPk(mentorId);

    if (!mentor || !mentor.is_coordinator) {
      return res.status(403).json({
        error: "Only coordinators allowed",
      });
    }

    // ✅ Fetch only same department students
    const teams = await User.findAll({
      attributes: ["UserId"],

      include: [
        {
          model: Student,

          attributes: [
            "student_name",
            "section",
            "register_no",
            "dept",
            "sem2_review1",
            "sem2_review2",
            "sem2_workbook",
          ],

          where: {
            dept: mentor.department,
          },

          required: true,
        },
      ],

     order: [
  [Student, "register_no", "ASC"]
],
    });

    const allScores = [];

    teams.forEach((team) => {
      team.Students.forEach((student) => {

        const r1 = student.sem2_review1 || 0;
        const r2 = student.sem2_review2 || 0;
        const wb = student.sem2_workbook || 0;

        const total = r1 + r2 + wb;

        allScores.push({
          teamId: team.UserId,

          name: student.student_name,
          section: student.section,
          register_no: String(student.register_no),
          dept: student.dept,

          review1score: r1,
          review2score: r2,
          workbook_score: wb,

          total_score: total,
        });
      });
    });

    allScores.sort((a, b) =>
  a.register_no.localeCompare(b.register_no)
);

    res.json(allScores);

  } catch (err) {
    console.error("❌ Error fetching review scores:", err);

    res.status(500).json({
      error: "Failed to fetch review scores",
    });
  }
});



export default router;
