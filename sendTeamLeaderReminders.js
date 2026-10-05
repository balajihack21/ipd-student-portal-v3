import sequelize from './models/index.js';
import { Op } from 'sequelize';
import User from './models/User.js';
import TeamUpload from './models/TeamUpload.js';
import Admin from './models/Admin.js';
import Sib from 'sib-api-v3-sdk';
import dotenv from 'dotenv';

dotenv.config();

async function sendTeamLeaderReminders() {
  try {
    console.log("📢 Checking for upcoming deadlines...");

    // 1. Fetch deadlines from admin table (assuming only one admin row)
    const admin = await Admin.findOne();
    if (!admin) {
      console.log("❌ No deadlines found in Admin table.");
      return;
    }

    // You can extend this mapping for all your deadlines
    const tasks = [
      { name: "Problem Statement & Affinity Diagram", field: "problem_deadline", week_number: 1 },
      { name: "SWOT Analysis", field: "swot_deadline", week_number: 2 },
      { name: "Value Proposition", field: "value_deadline", week_number: 3 },
    //   { name: "Review 1", field: "review1_deadline", week_number: 4 },
    //   { name: "Review 2", field: "review2_deadline", week_number: 5 }
    ];

    const today = new Date();
    console.log(admin)

    // 2. Loop over tasks and check which deadlines are near
    for (const task of tasks) {
      const deadline = admin[task.field];
      if (!deadline) continue;
      
      console.log(deadline)
      const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      console.log(daysLeft)

      // Send reminder if <= 2 days left
      if (daysLeft <= 7 && daysLeft >= 0) {
        console.log(`⏳ ${task.name} deadline in ${daysLeft} days`);

        // 3. Find teams who have NOT uploaded for this week_number
        const uploadedTeams = await TeamUpload.findAll({
          attributes: ['user_id'],
          where: { week_number: task.week_number }
        });

        const uploadedUserIds = uploadedTeams.map(u => u.user_id);

        const pendingTeams = await User.findAll({
          where: {
            UserId: { [Op.notIn]: uploadedUserIds }
          }
        });

        // 4. Send reminder emails
        if (pendingTeams.length) {
          const client = Sib.ApiClient.instance;
          const apiKey = client.authentications["api-key"];
          apiKey.apiKey = process.env.EMAIL_PASSWORD;
          const transEmailApi = new Sib.TransactionalEmailsApi();
          const sender = { email: process.env.EMAIL_USER, name: "IPD-TEAM" };
// team.email
          for (const team of pendingTeams) {
            await transEmailApi.sendTransacEmail({
              sender,
              to: [{ email:"mailztobalaji@gmail.com"}],
              subject: `Reminder: Upload ${task.name} before deadline`,
              htmlContent: `
                <p>Dear ${team.team_name} Leader,</p>
                <p>This is a reminder to upload your <strong>${task.name}</strong> document before the deadline:</p>
                <p><strong>${new Date(deadline).toLocaleString()}</strong></p>
                <p>Please log in and upload your file.</p>
                <p><a href="https://agni-ipd.onrender.com/">Go to IPD Dashboard</a></p>
                <br>
                <p>Best Regards,<br>IPD Team</p>
              `,
            });

            console.log(`📧 Reminder sent to ${team.email} for ${task.name}`);
          }
        } else {
          console.log(`✅ All teams submitted for ${task.name}`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Error sending team reminders:", err);
  } finally {
    await sequelize.close();
  }
}

export default sendTeamLeaderReminders;
