import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Sib from 'sib-api-v3-sdk';
import { fileURLToPath } from 'url';
import { Router } from 'express';
// import { upload, uploadToSupabase } from "../middleware/upload.js";
import { uploadprofile } from "../config/cloud_profile.js"
import { uploadToBackblaze } from "../middleware/upload.js";

import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Admin from '../models/Admin.js'
import Student from '../models/Student.js'
import TeamUpload from '../models/TeamUpload.js';
import UserRequirementCanvas from "../models/UserRequirementCanvas.js";
import ProductDimensions from "../models/ProductDimensions.js";
import PerformanceRequirement from '../models/PerformanceRequirement.js';
import BillOfMaterial from '../models/BillOfMaterial.js';
import ProblemStatement from '../models/Problem.js'
import authenticate from '../middleware/authenticate.js';
import { supabase } from "../config/cloudinary.js";
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage });

dotenv.config();

const router = Router();

router.get("/dashboard", authenticate, async (req, res) => {
  try {
    console.log(req.user)
    const user = await User.findByPk(req.user.userId);
    const students = await Student.findAll({ where: { user_id: req.user.userId } });
    const mentor = await Mentor.findOne({ where: { mentorId: user.mentor_id } });

    res.json({
      teamName: user.team_name,
      profilePhoto: user.profilePhoto,
      mobile: user.mobile,
      students,
      mentor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
//   try {
//     const filePath = req.file.path; // Cloudinary URL
//     const fileName = path.basename(filePath);
//     const userId = req.user.UserId;
//     const weekNumber = req.body.week_number;

//     console.log("filePath:", filePath);
//     console.log("userId:", userId);
//     console.log("weekNumber:", weekNumber);

//     const user = await User.findByPk(userId);
//     const mentorId = user.mentor_id;
//     const mentor = await Mentor.findByPk(mentorId);

//     const [uploadEntry, created] = await TeamUpload.findOrCreate({
//       where: { user_id: userId, week_number: weekNumber },
//       defaults: {
//         file_url: filePath,
//         status: "SUBMITTED",
//         mentor_id: mentorId,
//       },
//     });

//     console.log("Upload entry created:", created);

//     if (!created) {
//       uploadEntry.file_url = filePath;
//       uploadEntry.uploaded_at = new Date();
//       uploadEntry.status = "SUBMITTED";
//       uploadEntry.mentor_id = mentorId;
//       await uploadEntry.save();
//     }

//     // Setup Brevo (Sendinblue) API
//     const client = Sib.ApiClient.instance;
//     const apiKey = client.authentications["api-key"];
//     apiKey.apiKey = process.env.EMAIL_PASSWORD;

//     const transEmailApi = new Sib.TransactionalEmailsApi();
//     const sender = {
//       email: process.env.EMAIL_USER,
//       name: "IPD-TEAM",
//     };
// //  to: [{ email: mentor.email }],
//     const emailResponse = await transEmailApi.sendTransacEmail({
//       sender,
//       to:[{email:"balajiaru06@gmail.com"}],
//       subject: `Team Upload Notification - Week ${weekNumber}`,
//       textContent: `A file has been uploaded by your mentee (Team Name: ${user.team_name}) for week ${weekNumber}.`,
//       htmlContent: `<h3>Dear ${mentor.name},</h3>
//         <p>Your mentee has uploaded a file for <strong>Week ${weekNumber}</strong>.</p>
//         <p>You can view or download the file using the attachment or from the dashboard.</p>
//         <p>Team Name: <strong>${user.team_name}</strong></p>
//         <br />
//         <p>Best Regards,<br />IPD Team</p>`,
//       attachment: [
//         {
//           url: filePath,
//           name: fileName,
//         },
//       ],
//     });

//     console.log("Email sent successfully");

//     res.status(200).json({ message: "Upload successful", url: filePath });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });

// routes/upload.js


// router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;
//     const fileName = file.originalname;
//     const mimeType = file.mimetype;

//     const supabaseUrl = await uploadToSupabase(file.buffer, fileName, mimeType);
//     const userId = req.user.UserId;
//     const weekNumber = req.body.week_number;

//     const user = await User.findByPk(userId);
//     const mentorId = user.mentor_id;
//     const mentor = await Mentor.findByPk(mentorId);

//     const [uploadEntry, created] = await TeamUpload.findOrCreate({
//       where: { user_id: userId, week_number: weekNumber },
//       defaults: {
//         file_url: supabaseUrl,
//         status: "SUBMITTED",
//         mentor_id: mentorId,
//       },
//     });

//     if (!created) {
//       uploadEntry.file_url = supabaseUrl;
//       uploadEntry.uploaded_at = new Date();
//       uploadEntry.status = "SUBMITTED";
//       uploadEntry.mentor_id = mentorId;
//       await uploadEntry.save();
//     }

//     // Send email with Brevo (Sendinblue)
//     const client = Sib.ApiClient.instance;
//     const apiKey = client.authentications["api-key"];
//     apiKey.apiKey = process.env.EMAIL_PASSWORD;

//     const transEmailApi = new Sib.TransactionalEmailsApi();
//     const sender = {
//       email: process.env.EMAIL_USER,
//       name: "IPD-TEAM",
//     };
// //[{ email: mentor.email }]
// // console.log(mentor.email)
//     await transEmailApi.sendTransacEmail({
//   sender,
//   to: [{ email: "balajiaru06@gmail.com" }],
//   subject: `Team Upload Notification - Week ${weekNumber}`,
//   htmlContent: `<h3>Dear ${mentor.name},</h3>
//     <p>Your mentee has uploaded a file for <strong>Week ${weekNumber}</strong>.</p>
//     <p>You can view or download the file using the attachment or from the dashboard.</p>
//     <p><a href="https://ipd-portal.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
//     <p><a href="${supabaseUrl}" target="_blank">${fileName}</a></p>
//     <p>Team Name: <strong>${user.team_name}</strong></p>
//     <br />
//     <p>Best Regards,<br />IPD Team</p>`,
//   attachment: [
//     {
//       url: supabaseUrl,
//       name: fileName,
//     },
//   ],
// });


//     res.status(200).json({ message: "Upload successful", url: supabaseUrl });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });



// router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;
//     const fileName = file.originalname;
//     const mimeType = file.mimetype;

//     const supabaseUrl = await uploadToSupabase(file.buffer, fileName, mimeType);
//     const userId = req.user.userId;
//     const weekNumber = req.body.week_number;

//     const user = await User.findByPk(userId);
//     const mentorId = user.mentor_id;
//     const mentor = await Mentor.findByPk(mentorId);

//     const [uploadEntry, created] = await TeamUpload.findOrCreate({
//       where: { user_id: userId, week_number: weekNumber },
//       defaults: {
//         file_url: supabaseUrl,
//         status: "SUBMITTED",
//         mentor_id: mentorId,
//       },
//     });

//     if (!created) {
//       uploadEntry.file_url = supabaseUrl;
//       uploadEntry.uploaded_at = new Date();
//       uploadEntry.status = "SUBMITTED";
//       uploadEntry.mentor_id = mentorId;
//       await uploadEntry.save();
//     }

//     // Send email with Brevo (Sendinblue)
// const client = Sib.ApiClient.instance;
// const apiKey = client.authentications["api-key"];
// apiKey.apiKey = process.env.EMAIL_PASSWORD;

// const transEmailApi = new Sib.TransactionalEmailsApi();
// const sender = {
//   email: process.env.EMAIL_USER,
//   name: "IPD-TEAM",
// };
// //[{ email: mentor.email }]
// // console.log(mentor.email)
//     await transEmailApi.sendTransacEmail({
//   sender,
//   to: [{ email: "balajiaru06@gmail.com" }],
//   subject: `Team Upload Notification - Week ${weekNumber}`,
//   htmlContent: `<h3>Hello ${mentor.title}${mentor.name},</h3>
//     <p>Your mentee has uploaded a file for <strong>Week ${weekNumber}</strong>.</p>
//     <p>You can view or download the file using the attachment or from the dashboard.</p>
//     <p><a href="https://ipd-portal.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
//     <p><a href="${supabaseUrl}" target="_blank">${fileName}</a></p>
//     <p>Team Name: <strong>${user.team_name}</strong></p>
//     <p>Contact No: <strong>${user.mobile}</strong></p>
//     <br />
//     <p>Best Regards,<br />IPD Team</p>`,
//   attachment: [
//     {
//       url: supabaseUrl,
//       name: fileName,
//     },
//   ],
// });


//     res.status(200).json({ message: "Upload successful", url: supabaseUrl });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });



// router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;
//     const fileName = file.originalname;
//     const mimeType = file.mimetype;

//     const fileUrl = await uploadToBackblaze(file.buffer, fileName, mimeType);
//     const userId = req.user.userId;
//     const weekNumber = req.body.week_number;

//     const user = await User.findByPk(userId);
//     const mentorId = user.mentor_id;
//     const mentor = await Mentor.findByPk(mentorId);

//     const [uploadEntry, created] = await TeamUpload.findOrCreate({
//       where: { user_id: userId, week_number: weekNumber },
//       defaults: {
//         file_url: fileUrl,
//         status: "SUBMITTED",
//         mentor_id: mentorId,
//       },
//     });

//     if (!created) {
//       uploadEntry.file_url = fileUrl;
//       uploadEntry.uploaded_at = new Date();
//       uploadEntry.status = "SUBMITTED";
//       uploadEntry.mentor_id = mentorId;
//       await uploadEntry.save();
//     }

//         const client = Sib.ApiClient.instance;
//     const apiKey = client.authentications["api-key"];
//     apiKey.apiKey = process.env.EMAIL_PASSWORD;

//     const transEmailApi = new Sib.TransactionalEmailsApi();
//     const sender = {
//       email: process.env.EMAIL_USER,
//       name: "IPD-TEAM",
//     };
// //mentor.email
//     // Email notification (unchanged, just replaced supabaseUrl with fileUrl)
//     await transEmailApi.sendTransacEmail({
//       sender,
//       to: [{ email:mentor.email }],
//       subject: `Team Upload Notification - File ${weekNumber}`,
//       htmlContent: `<h3>Hello ${mentor.title}${mentor.name},</h3>
//         <p>Your mentee has uploaded a file for <strong>File ${weekNumber}</strong>.</p>
//         <p>You can view or download the file using the attachment or from the dashboard.</p>
//         <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
//         <p><a href="${fileUrl}" target="_blank">${fileName}</a></p>
//         <p>Team Name: <strong>${user.team_name}</strong></p>
//         <p>Contact No: <strong>${user.mobile}</strong></p>
//         <p>Best Regards,<br />IPD Team</p>`,
//       attachment: [
//         {
//           url: fileUrl,
//           name: fileName,
//         },
//       ],
//     });

//     res.status(200).json({ message: "Upload successful", url: fileUrl });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });


import SwotAnalysis from "../models/Swot.js";

import IdeaSelection from "../models/Idea.js";



// Create new idea selection
router.post("/idea", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findByPk(userId);
    const mentorId = user.mentor_id;
    const mentor = await Mentor.findByPk(mentorId);

    const { team_name, list_of_ideas, ideas_scores, selected_idea } = req.body;

    if (!team_name || !list_of_ideas || !ideas_scores) {
      return res.status(400).json({ message: "Team Name, Ideas, and Scores are required" });
    }

    // Check if IdeaSelection already exists
    let ideaSelection = await IdeaSelection.findOne({ where: { user_id: userId } });

    if (ideaSelection) {
      // Update existing record
      await ideaSelection.update({
        team_name,
        list_of_ideas,
        ideas_scores,
        selected_idea
      });

      await TeamUpload.upsert({
        user_id: userId,
        week_number: 3, // special code for Idea Selection
        file_url: "#",
        status: "SUBMITTED",
      });

      // Send email to mentor
      const client = Sib.ApiClient.instance;
      const apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_PASSWORD;

      const transEmailApi = new Sib.TransactionalEmailsApi();
      const sender = {
        email: process.env.EMAIL_USER,
        name: "IPD-TEAM",
      };

      await transEmailApi.sendTransacEmail({
        sender,
        to: [{ email: mentor.email }],
        subject: `Team Upload Notification - Idea Generation Canvas`,
        htmlContent: `<h3>Hello ${mentor.title || ""} ${mentor.name},</h3>
          <p>Your mentee has updated their submission for <strong>Idea Generation Canvas</strong>.</p>
          <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
          <p>Team Name: <strong>${user.team_name}</strong></p>
          <p>Contact No: <strong>${user.mobile}</strong></p>
          <p>Best Regards,<br />IPD Team</p>`,
      });

      return res.status(200).json({ message: "Idea Selection updated successfully", ideaSelection });

    } else {
      // Create new record
      ideaSelection = await IdeaSelection.create({
        user_id: userId,
        team_name,
        list_of_ideas,
        ideas_scores,
        selected_idea
      });

      await TeamUpload.upsert({
        user_id: userId,
        week_number: 3, // special code for Idea Selection
        file_url: "#",
        status: "SUBMITTED",
      });

      // Send email to mentor
      const client = Sib.ApiClient.instance;
      const apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_PASSWORD;

      const transEmailApi = new Sib.TransactionalEmailsApi();
      const sender = {
        email: process.env.EMAIL_USER,
        name: "IPD-TEAM",
      };
      //mentor.email
      await transEmailApi.sendTransacEmail({
        sender,
        to: [{ email: mentor.email }],
        subject: `Team Upload Notification - Idea Generation Canvas`,
        htmlContent: `<h3>Hello ${mentor.title || ""} ${mentor.name},</h3>
          <p>Your mentee has uploaded a file for <strong>Idea Generation Canvas</strong>.</p>
          <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
          <p>Team Name: <strong>${user.team_name}</strong></p>
          <p>Contact No: <strong>${user.mobile}</strong></p>
          <p>Best Regards,<br />IPD Team</p>`,
      });

      return res.status(201).json({ message: "Idea Selection created successfully", ideaSelection });
    }
  } catch (err) {
    console.error("Error saving Idea Selection:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/idea/mine", authenticate, async (req, res) => {
  try {
    const idea = await IdeaSelection.findOne({
      where: { user_id: req.user.userId }
    });

    if (!idea) return res.status(404).json(null); // no data
    res.json(idea);
  } catch (err) {
    console.error("Error fetching IdeaSelection:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Update existing idea selection
router.put("/idea/:id", authenticate, async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { id } = req.params;
    const { team_name, list_of_ideas, ideas_scores } = req.body;

    const ideaSelection = await IdeaSelection.findOne({
      where: { id, user_id },
    });

    if (!ideaSelection) {
      return res.status(404).json({ error: "Idea selection not found" });
    }

    // Update fields
    ideaSelection.team_name = team_name || ideaSelection.team_name;
    ideaSelection.list_of_ideas = list_of_ideas || ideaSelection.list_of_ideas;
    ideaSelection.ideas_scores = ideas_scores || ideaSelection.ideas_scores;

    await ideaSelection.save();

    await TeamUpload.upsert({
      user_id: user_id,
      week_number: 3, // special code for SWOT
      file_url: "#",  // no file, just mark entry
      status: "SUBMITTED",
    });

    res.json(ideaSelection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update idea selection" });
  }
});

// Get all idea selections
router.get("/", authenticate, async (req, res) => {
  try {
    const data = await IdeaSelection.findAll({ include: User });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});



// POST /api/swot - create or update SWOT data
router.post("/swot", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId; // from authenticate middleware
    const user = await User.findByPk(userId);
    const mentorId = user.mentor_id;
    const mentor = await Mentor.findByPk(mentorId);
    const {
      teamName,
      selectedIdea,
      strengths,
      weakness,
      opportunities,
      threats
    } = req.body;

    // Validate required fields
    if (!teamName || !selectedIdea) {
      return res.status(400).json({ message: "Team Name and Selected Idea are required" });
    }

    // Check if SWOT already exists for this user
    let swot = await SwotAnalysis.findOne({ where: { user_id: userId } });

    if (swot) {
      // Update existing SWOT
      await swot.update({
        team_name: teamName,
        selected_idea: selectedIdea,
        strengths,
        weakness,
        opportunities,
        threats
      });

      await TeamUpload.upsert({
        user_id: userId,
        week_number: 4, // special code for SWOT
        file_url: "#",  // no file, just mark entry
        status: "SUBMITTED",
      });

      const client = Sib.ApiClient.instance;
      const apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_PASSWORD;

      const transEmailApi = new Sib.TransactionalEmailsApi();
      const sender = {
        email: process.env.EMAIL_USER,
        name: "IPD-TEAM",
      };

      await transEmailApi.sendTransacEmail({
        sender,
        to: [{ email: mentor.email }],
        subject: `Team Upload Notification - Swot Analysis`,
        htmlContent: `<h3>Hello ${mentor.title || ""} ${mentor.name},</h3>
        <p>Your mentee has uploaded a file for <strong>Swot Analysis</strong>.</p>
        <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
        <p>Team Name: <strong>${user.team_name}</strong></p>
        <p>Contact No: <strong>${user.mobile}</strong></p>
        <p>Best Regards,<br />IPD Team</p>`,
      });
      return res.status(200).json({ message: "SWOT Analysis updated successfully", swot });
    } else {
      // Create new SWOT
      swot = await SwotAnalysis.create({
        user_id: userId,
        team_name: teamName,
        selected_idea: selectedIdea,
        strengths,
        weakness,
        opportunities,
        threats
      });

      await TeamUpload.upsert({
        user_id: userId,
        week_number: 4, // special code for SWOT
        file_url: "#",  // no file, just mark entry
        status: "SUBMITTED",
      });

      const client = Sib.ApiClient.instance;
      const apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_PASSWORD;

      const transEmailApi = new Sib.TransactionalEmailsApi();
      const sender = {
        email: process.env.EMAIL_USER,
        name: "IPD-TEAM",
      };
      await transEmailApi.sendTransacEmail({
        sender,
        to: [{ email: mentor.email }],
        subject: `Team Upload Notification - Swot Analysis`,
        htmlContent: `<h3>Hello ${mentor.title || ""} ${mentor.name},</h3>
        <p>Your mentee has uploaded a file.</p>
        <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
        <p>Team Name: <strong>${user.team_name}</strong></p>
        <p>Contact No: <strong>${user.mobile}</strong></p>
        <p>Best Regards,<br />IPD Team</p>`,
      });

      return res.status(201).json({ message: "SWOT Analysis created successfully", swot });
    }
  } catch (err) {
    console.error("Error saving SWOT:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET logged-in user's SWOT
router.get("/swot/mine", authenticate, async (req, res) => {
  try {
    const swot = await SwotAnalysis.findOne({
      where: { user_id: req.user.userId }
    });

    if (!swot) return res.status(404).json(null); // no data
    res.json(swot);
  } catch (err) {
    console.error("Error fetching SWOT:", err);
    res.status(500).json({ error: "Server error" });
  }
});


import ValueProposition from '../models/Value.js';


// Create or update value proposition


router.post('/value-proposition', authenticate, async (req, res) => {
  try {
    const user_id = req.user.userId;
    const user = await User.findByPk(user_id);
    const mentor = user.mentor_id ? await Mentor.findByPk(user.mentor_id) : null;
    const {
      gain_creators,
      gains,
      products_and_services,
      customer_jobs,
      pain_relievers,
      pains,
      value_proposition,
      customer_segment
    } = req.body;

    // Check if record exists for user
    let vp = await ValueProposition.findOne({ where: { user_id } });

    if (vp) {
      await vp.update({
        gain_creators,
        gains,
        products_and_services,
        customer_jobs,
        pain_relievers,
        pains,
        value_proposition,
        customer_segment
      });
    } else {
      vp = await ValueProposition.create({
        user_id,
        gain_creators,
        gains,
        products_and_services,
        customer_jobs,
        pain_relievers,
        pains,
        value_proposition,
        customer_segment
      });
    }

    // Upsert team upload log
    await TeamUpload.upsert({
      user_id,
      week_number: 5,
      file_url: "#",
      status: "SUBMITTED",
    });

    // Send email notification
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = { email: process.env.EMAIL_USER, name: "IPD-TEAM" };
    await transEmailApi.sendTransacEmail({
      sender,
      to: [{ email: mentor.email }],
      subject: `Team Upload Notification - Value Proposition Canvas`,
      htmlContent: `<h3>Hello ${mentor ? `${mentor.title || ""} ${mentor.name || ""}` : "Mentor"},</h3>
      <p>Your mentee has uploaded a file for <strong>Value Proposition</strong>.</p>
      <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
      <p>Team Name: <strong>${user.team_name}</strong></p>
      <p>Contact No: <strong>${user.mobile}</strong></p>
      <p>Best Regards,<br />IPD Team</p>`
    });

    res.status(200).json({ success: true, data: vp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});
router.post('/problem-statement', authenticate, async (req, res) => {
  try {
    const { problem_description, selected_idea } = req.body;
    const userId = req.user.userId;

    const existing = await ProblemStatement.findOne({ where: { user_id: userId } });
    if (existing) {
      return res.status(400).json({ message: 'Problem statement already submitted. Use PUT to update.' });
    }

    const problem = await ProblemStatement.create({
      problem_description,
      selected_idea,
      user_id: userId
    });

    res.status(201).json({ message: 'Problem statement saved successfully.', id: problem.id });
  } catch (error) {
    console.error('Error saving problem statement:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get My Problem Statement
router.get('/problem-statement/mine', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const problem = await ProblemStatement.findOne({ where: { user_id: userId } });
    res.json(problem || {});
  } catch (error) {
    console.error('Error fetching problem statement:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update Problem Statement
router.put('/problem-statement/:id', authenticate, async (req, res) => {
  try {
    const { problem_description, selected_idea } = req.body;
    const userId = req.user.userId;
    const problemId = req.params.id;

    const problem = await ProblemStatement.findOne({ where: { id: problemId, user_id: userId } });
    if (!problem) {
      return res.status(404).json({ message: 'Problem statement not found.' });
    }

    problem.problem_description = problem_description;
    problem.selected_idea = selected_idea;
    await problem.save();

    res.json({ message: 'Problem statement updated successfully.', id: problem.id });
  } catch (error) {
    console.error('Error updating problem statement:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});




router.get("/value-proposition/mine", authenticate, async (req, res) => {
  try {
    const vp = await ValueProposition.findOne({
      where: { user_id: req.user.userId }
    });

    if (!vp) return res.status(404).json(null); // no data
    res.json(vp);
  } catch (err) {
    console.error("Error fetching Value Proposition:", err);
    res.status(500).json({ error: "Server error" });
  }
});





router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const fileName = file.originalname;
    const mimeType = file.mimetype;

    // Upload to Backblaze (returns { key, signedUrl })
    const { key: fileKey, signedUrl } = await uploadToBackblaze(
      file.buffer,
      fileName,
      mimeType
    );

    const userId = req.user.userId;
    const weekNumber = req.body.week_number;

    const user = await User.findByPk(userId);
    const mentorId = user.mentor_id;
    const mentor = await Mentor.findByPk(mentorId);

    const [uploadEntry, created] = await TeamUpload.findOrCreate({
      where: { user_id: userId, week_number: weekNumber },
      defaults: {
        file_url: signedUrl,   // 🔑 signed URL
        file_key: fileKey,     // 🔑 permanent key
        status: "SUBMITTED",
        mentor_id: mentorId,
      },
    });

    if (!created) {
      uploadEntry.file_url = signedUrl;  // always update to fresh signed link
      uploadEntry.file_key = fileKey;
      uploadEntry.uploaded_at = new Date();
      uploadEntry.status = "SUBMITTED";
      uploadEntry.mentor_id = mentorId;
      await uploadEntry.save();
    }

    // 📧 Email notification
    // 📧 Email notification

    const weekTitles = {
      10: "2D Modelling",
      11: "3D Modelling",
      12: "DB Schema",
      13: "HLD",
      14: "Tech Stack Architecture",
      15: "User Flow Diagram",
      16: "Mock Up",
      17: "BMC Template",
      18: "Prototype Planning Canvas"
    };

    const submissionTitle = weekTitles[weekNumber] || `File ${weekNumber}`;

    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();

    const sender = {
      email: process.env.EMAIL_USER,
      name: "IPD-TEAM",
    };

    await transEmailApi.sendTransacEmail({
      sender,
      to: [{ email: mentor.email }],
      subject: `Team Upload Notification - ${submissionTitle}`,
      htmlContent: `
    <h3>Hello ${mentor.title || ""} ${mentor.name},</h3>

    <p>Your mentee has uploaded a file for 
      <strong>${submissionTitle}</strong>.
    </p>

    <p>You can view or download the file using the attachment or from the dashboard.</p>

    <p>
      <a href="https://agni-ipd.onrender.com/" target="_blank">
        IPD Dashboard Link
      </a>
    </p>

    <p>
      <a href="${signedUrl}" target="_blank">${fileName}</a>
    </p>

    <p>Team Name: <strong>${user.team_name}</strong></p>
    <p>Contact No: <strong>${user.mobile}</strong></p>

    <p>Best Regards,<br />IPD Team</p>
  `,
      attachment: [
        {
          url: signedUrl,
          name: fileName,
        },
      ],
    });

    res.status(200).json({
      message: "Upload successful",
      url: signedUrl,
      key: fileKey,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});





import { getSignedFileUrl } from "../backblaze.js";

router.get("/upload-history", authenticate, async (req, res) => {
  try {
    const uploads = await TeamUpload.findAll({
      where: { user_id: req.user.userId },
      order: [["week_number", "ASC"]],
    });

    // Replace file_url with signed Backblaze URL
    const signedUploads = await Promise.all(
      uploads.map(async (upload) => {
        let signedUrl = null;
        if (upload.file_key) {
          signedUrl = await getSignedFileUrl(upload.file_key); // 7 days max
        }
        return {
          ...upload.toJSON(),
          file_url: signedUrl, // replace with signed URL
        };
      })
    );

    res.json(signedUploads);
  } catch (err) {
    console.error("Upload fetch error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


// router.put('/profile', authenticate, async (req, res) => {
//   try {
//     const userId = req.user.UserId; // from decoded token
//     const { mobile } = req.body;

//     if (!mobile || mobile.length < 10 || mobile.length>10) {
//       return res.status(400).json({ message: "Invalid mobile number" });
//     }

//     await User.update({ mobile }, { where: { UserId: userId } });

//     return res.json({ message: 'Mobile number updated successfully' });
//   } catch (err) {
//     console.error("Error updating profile:", err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// PUT /profile - Update mobile numbers
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { mobile, studentMobiles = [] } = req.body;

    // Validate team leader mobile
    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ message: "Invalid team leader mobile number" });
    }

    await User.update({ mobile }, { where: { UserId: userId } });

    for (const student of studentMobiles) {
      if (!student.id || !student.mobile || student.mobile.length !== 10) {
        return res.status(400).json({ message: "Invalid student mobile input" });
      }

      await Student.update(
        { mobile: student.mobile },
        { where: { id: student.id, user_id: userId } } // Prevent tampering
      );
    }

    return res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post("/upload-profile-photo", authenticate, uploadprofile.single("photo"), async (req, res) => {
  console.log(req.file)
  try {
    const file = req.file;
    const photoUrl = file.path; // Cloudinary URL
    const userId = req.user.userId;

    // Update photo URL in the user table
    await User.update(
      { profilePhoto: photoUrl },
      { where: { UserId: userId } }
    );


    res.json({ photoUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});


// router.get("/deadlines",authenticate, async (req, res) => {
//   try {
//     const admin = await Admin.findOne(); // assuming only one admin record
//     res.json({
//       problem_deadline: admin.problem_deadline,
//       swot_deadline: admin.swot_deadline,
//       value_deadline: admin.value_deadline
//     });
//   } catch (err) {
//     console.error("Error fetching deadlines:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });


// routes/admin.js (or wherever you defined deadlines route)


router.get("/deadlines", authenticate, async (req, res) => {
  try {
    let timelines = [];
    let batch = null;
    let isLocked = false;

    // Student token
    if (req.user.userId) {
      const user = await User.findOne({
        where: { UserId: req.user.userId },
        attributes: ["UserId", "isLocked"]
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      isLocked = user.isLocked || false;
      const userIdStr = user.UserId.toString();
      batch = userIdStr.match(/^(\d{2}IPD)/i)?.[1]?.toUpperCase() || null;
    }
    // Mentor / coordinator token — return timelines for all batches (coordinator sees everything)
    else if (req.user.mentorId) {
      const BatchTimeline = (await import('../models/BatchTimeline.js')).default;
      const allTimelines = await BatchTimeline.findAll({
        attributes: ['stage', 'start', 'deadline', 'batch']
      });
      // Group by batch and return all
      timelines = allTimelines.map(t => ({ stage: t.stage, start: t.start, deadline: t.deadline, batch: t.batch }));
      return res.json({ isLocked: false, batch: null, timelines });
    } else {
      return res.status(401).json({ error: "Invalid token: no userId or mentorId" });
    }

    if (batch) {
      const BatchTimeline = (await import('../models/BatchTimeline.js')).default;
      timelines = await BatchTimeline.findAll({
        where: { batch },
        attributes: ['stage', 'start', 'deadline']
      });
    }

    res.json({
      isLocked,
      batch,
      timelines: timelines.map(t => ({
        stage: t.stage,
        start: t.start,
        deadline: t.deadline
      }))
    });
  } catch (err) {
    console.error("Error fetching deadlines:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==============================
// USER REQUIREMENTS CANVAS
// ==============================

router.post("/user-requirements", authenticate, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const user = await User.findByPk(user_id);
    const mentor = user.mentor_id
      ? await Mentor.findByPk(user.mentor_id)
      : null;

    const {
      user_requirements,
      product_features,
      must_have,
      should_have,
      could_have,
      wont_have
    } = req.body;

    // Check existing record
    let canvas = await UserRequirementCanvas.findOne({
      where: { user_id }
    });

    if (canvas) {
      await canvas.update({
        user_requirements,
        product_features,
        must_have,
        should_have,
        could_have,
        wont_have
      });
    } else {
      canvas = await UserRequirementCanvas.create({
        user_id,
        user_requirements,
        product_features,
        must_have,
        should_have,
        could_have,
        wont_have
      });
    }

    // Log submission (Week 6 - you can change number if needed)
    await TeamUpload.upsert({
      user_id,
      week_number: 6,
      file_url: "#",
      status: "SUBMITTED",
    });

    // Send email to mentor
    if (mentor) {
      const client = Sib.ApiClient.instance;
      const apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_PASSWORD;

      const transEmailApi = new Sib.TransactionalEmailsApi();
      const sender = {
        email: process.env.EMAIL_USER,
        name: "IPD-TEAM",
      };

      await transEmailApi.sendTransacEmail({
        sender,
        to: [{ email: mentor.email }],
        subject: `Team Upload Notification - User Requirement Canvas`,
        htmlContent: `<h3>Hello ${mentor.title || ""} ${mentor.name},</h3>
          <p>Your mentee has submitted <strong>User Requirement Canvas</strong>.</p>
          <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
          <p>Team Name: <strong>${user.team_name}</strong></p>
          <p>Contact No: <strong>${user.mobile}</strong></p>
          <p>Best Regards,<br />IPD Team</p>`
      });
    }

    res.status(200).json({ success: true, data: canvas });

  } catch (err) {
    console.error("Error saving User Requirement Canvas:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


router.get("/user-requirements/mine", authenticate, async (req, res) => {
  try {
    const canvas = await UserRequirementCanvas.findOne({
      where: { user_id: req.user.userId }
    });

    if (!canvas) return res.json(null);

    res.json(canvas);

  } catch (err) {
    console.error("Error fetching User Requirement Canvas:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ---------------- PRODUCT DIMENSIONS ----------------

router.post("/product-dimensions", authenticate, async (req, res) => {
  try {
    const user_id = req.user.userId;
    const user = await User.findByPk(user_id);

    const mentor = user.mentor_id
      ? await Mentor.findByPk(user.mentor_id)
      : null;

    const { dimensions } = req.body;
    // Expected format:
    // dimensions: [{ parameter: "", dimension: "" }, ...]

    let record = await ProductDimensions.findOne({
      where: { user_id }
    });

    if (record) {
      await record.update({ dimensions });
    } else {
      record = await ProductDimensions.create({
        user_id,
        dimensions
      });
    }

    await TeamUpload.upsert({
      user_id,
      week_number: 7,
      file_url: "#",
      status: "SUBMITTED",
    });

    if (mentor) {
      const client = Sib.ApiClient.instance;
      const apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_PASSWORD;

      const transEmailApi = new Sib.TransactionalEmailsApi();
      const sender = {
        email: process.env.EMAIL_USER,
        name: "IPD-TEAM",
      };

      await transEmailApi.sendTransacEmail({
        sender,
        to: [{ email: mentor.email }],
        subject: `Team Upload Notification - Product Dimensions`,
        htmlContent: `
      <h3>Hello ${mentor.title || ""} ${mentor.name},</h3>
      <p>Your mentee has submitted <strong>Product Dimensions</strong>.</p>
      <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
      <p>Team Name: <strong>${user.team_name}</strong></p>
      <p>Contact No: <strong>${user.mobile}</strong></p>
      <p>Best Regards,<br />IPD Team</p>
    `
      });
    }

    res.status(200).json({ success: true, data: record });

  } catch (err) {
    console.error("Error saving Product Dimensions:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


router.get("/product-dimensions/mine", authenticate, async (req, res) => {
  try {
    const record = await ProductDimensions.findOne({
      where: { user_id: req.user.userId }
    });

    if (!record) return res.json(null);

    res.json(record);

  } catch (err) {
    console.error("Error fetching Product Dimensions:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ---------------- PERFORMANCE REQUIREMENTS ----------------

router.post("/performance-requirements", authenticate, async (req, res) => {
  try {
    const user_id = req.user.userId;
    const user = await User.findByPk(user_id);

    const mentor = user.mentor_id
      ? await Mentor.findByPk(user.mentor_id)
      : null;

    const { performance_data } = req.body;
    // Expected:
    // [{ parameter, expectedPerformance, justification }]

    let record = await PerformanceRequirement.findOne({
      where: { user_id }
    });

    if (record) {
      await record.update({ performance_data });
    } else {
      record = await PerformanceRequirement.create({
        user_id,
        performance_data
      });
    }

    await TeamUpload.upsert({
      user_id,
      week_number: 8,
      file_url: "#",
      status: "SUBMITTED",
    });


    if (mentor) {
      const client = Sib.ApiClient.instance;
      const apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_PASSWORD;

      const transEmailApi = new Sib.TransactionalEmailsApi();
      const sender = {
        email: process.env.EMAIL_USER,
        name: "IPD-TEAM",
      };

      await transEmailApi.sendTransacEmail({
        sender,
        to: [{ email: mentor.email }],
        subject: `Team Upload Notification - Product Dimensions`,
        htmlContent: `
      <h3>Hello ${mentor.title || ""} ${mentor.name},</h3>
      <p>Your mentee has submitted <strong>Product Dimensions</strong>.</p>
      <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
      <p>Team Name: <strong>${user.team_name}</strong></p>
      <p>Contact No: <strong>${user.mobile}</strong></p>
      <p>Best Regards,<br />IPD Team</p>
    `
      });
    }

    res.status(200).json({ success: true, data: record });

  } catch (err) {
    console.error("Error saving Performance Requirements:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


router.get("/performance-requirements/mine", authenticate, async (req, res) => {
  try {
    const record = await PerformanceRequirement.findOne({
      where: { user_id: req.user.userId }
    });

    if (!record) return res.json(null);

    res.json(record);

  } catch (err) {
    console.error("Error fetching Performance Requirements:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


// ---------------- BILL OF MATERIALS ----------------

router.post("/bill-of-materials", authenticate, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const user = await User.findByPk(user_id);

    const mentor = user.mentor_id
      ? await Mentor.findByPk(user.mentor_id)
      : null;

    const { bom_data } = req.body;
    // Expected:
    // [{ component, material, quantity }]

    let record = await BillOfMaterial.findOne({
      where: { user_id }
    });

    if (record) {
      await record.update({ bom_data });
    } else {
      record = await BillOfMaterial.create({
        user_id,
        bom_data
      });
    }

    await TeamUpload.upsert({
      user_id,
      week_number: 9,
      file_url: "#",
      status: "SUBMITTED",
    });


    if (mentor) {
      const client = Sib.ApiClient.instance;
      const apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_PASSWORD;

      const transEmailApi = new Sib.TransactionalEmailsApi();
      const sender = {
        email: process.env.EMAIL_USER,
        name: "IPD-TEAM",
      };

      await transEmailApi.sendTransacEmail({
        sender,
        to: [{ email: mentor.email }],
        subject: `Team Upload Notification - Bill Of Materials`,
        htmlContent: `
      <h3>Hello ${mentor.title || ""} ${mentor.name},</h3>
      <p>Your mentee has submitted <strong>Bill Of Materials</strong>.</p>
      <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
      <p>Team Name: <strong>${user.team_name}</strong></p>
      <p>Contact No: <strong>${user.mobile}</strong></p>
      <p>Best Regards,<br />IPD Team</p>
    `
      });
    }

    res.status(200).json({ success: true, data: record });

  } catch (err) {
    console.error("Error saving Bill Of Materials:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


router.get("/bill-of-materials/mine", authenticate, async (req, res) => {
  try {
    const record = await BillOfMaterial.findOne({
      where: { user_id: req.user.userId }
    });

    if (!record) return res.json(null);

    res.json(record);

  } catch (err) {
    console.error("Error fetching Bill Of Materials:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


export default router;
