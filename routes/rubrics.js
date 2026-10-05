// // routes/admin.js
// import express from 'express';
// import Admin from '../models/Admin.js';

// const router = express.Router();

// // Get deadlines
// router.get('/review1-deadline', async (req, res) => {
//   try {
//     const admin = await Admin.findOne(); // assuming single admin row
//     res.json({
//       start: admin?.review1_start,
//       deadline: admin?.review1_deadline
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch review deadlines' });
//   }
// });

// // Update deadlines
// router.post('/review1-deadline', async (req, res) => {
//   try {
//     const { start, deadline } = req.body;
//     if (!start || !deadline) {
//       return res.status(400).json({ error: 'Start and deadline required' });
//     }

//     let admin = await Admin.findOne();
//     if (!admin) admin = await Admin.create({ email: "default@admin.com", password: "hashed" });

//     admin.review1_start = start;
//     admin.review1_deadline = deadline;
//     await admin.save();

//     res.json({ success: true, start: admin.review1_start, deadline: admin.review1_deadline });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to update deadlines' });
//   }
// });

// export default router;


// routes/admin.js
import express from "express";
import Admin from "../models/Admin.js";

const router = express.Router();

/**
 * Allowed deadline fields in Admin model
 */
const allowedDeadlines = {
  review1: { start: "review1_start", deadline: "review1_deadline" },
  problem: { start: "problem_start", deadline: "problem_deadline" },
  swot: { start: "swot_start", deadline: "swot_deadline" },
  value: { start: "value_start", deadline: "value_deadline" },
  review2: { start: "review2_start", deadline: "review2_deadline" }
};

/**
 * Generic GET deadline
 * Example: GET /admin/deadline/review1
 */
router.get("/deadline/:stage", async (req, res) => {
  try {
    const { stage } = req.params;

    if (!allowedDeadlines[stage]) {
      return res.status(400).json({ error: "Invalid stage" });
    }

    const admin = await Admin.findOne();
    res.json({
      start: admin?.[allowedDeadlines[stage].start] || null,
      deadline: admin?.[allowedDeadlines[stage].deadline] || null
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch deadlines" });
  }
});

/**
 * Generic POST deadline
 * Example: POST /admin/deadline/review1
 * Body: { start: "2025-08-20T10:00:00Z", deadline: "2025-08-30T23:59:59Z" }
 */
router.post("/deadline/:stage", async (req, res) => {
  try {
    const { stage } = req.params;
    const { start, deadline } = req.body;

    if (!allowedDeadlines[stage]) {
      return res.status(400).json({ error: "Invalid stage" });
    }

    if (!start || !deadline) {
      return res.status(400).json({ error: "Start and deadline required" });
    }

    let admin = await Admin.findOne();
    if (!admin) {
      admin = await Admin.create({
        email: "default@admin.com",
        password: "hashed" // ⚠️ make sure to replace with real hashed password
      });
    }

    admin[allowedDeadlines[stage].start] = start;
    admin[allowedDeadlines[stage].deadline] = deadline;
    await admin.save();

    res.json({
      success: true,
      start: admin[allowedDeadlines[stage].start],
      deadline: admin[allowedDeadlines[stage].deadline]
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update deadlines" });
  }
});

export default router;
