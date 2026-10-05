// import sequelize from './models/index.js';
// import { Op } from 'sequelize';
// import Mentor from './models/Mentor.js';
// import User from './models/User.js';
// import TeamUpload from './models/TeamUpload.js';
// import Sib from 'sib-api-v3-sdk';
// import dotenv from 'dotenv';

// dotenv.config();

// async function sendMentorReviewReminders() {
//   try {

//     console.log("entering")
//     // 1. Find uploads older than 2 days and not reviewed
//     const twoDaysAgo = new Date();
//     twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

//     const pendingUploads = await TeamUpload.findAll({
//       where: {
//         status: { [Op.ne]: 'REVIEWED' },
//         uploaded_at: { [Op.lt]: twoDaysAgo }
//       },
//       include: [
//   {
//     model: User,
//     attributes: ['UserId', 'team_name', 'mentor_id'],
//     include: [
//       { model: Mentor, as: 'mentor', attributes: ['mentorId', 'title', 'name', 'email'] }
//     ]
//   }
// ]
    
//     });
//     console.log(pendingUploads.length)

//     if (!pendingUploads.length) {
//       console.log('✅ No pending reviews older than 2 days.');
//       return;
//     }

//     // 2. Group uploads by mentor
//     const mentorMap = {};
//     for (const upload of pendingUploads) {
//       const mentor = upload.User?.mentor;
//       if (!mentor) continue;
//       if (!mentorMap[mentor.mentorId]) {
//         mentorMap[mentor.mentorId] = {
//           mentor,
//           uploads: []
//         };
//       }
//       mentorMap[mentor.mentorId].uploads.push(upload);
//     }

//     console.log(mentorMap)

//     // 3. Email each mentor with their pending reviews
//     const client = Sib.ApiClient.instance;
//     const apiKey = client.authentications["api-key"];
//     apiKey.apiKey = process.env.EMAIL_PASSWORD;

//     const transEmailApi = new Sib.TransactionalEmailsApi();
//     const sender = {
//       email: process.env.EMAIL_USER,
//       name: "IPD-TEAM",
//     };

//     for (const mentorId in mentorMap) {
//       const { mentor, uploads } = mentorMap[mentorId];
//       const uploadListHtml = uploads.map(u => `
//         <li>Team: <strong>${u.User.team_name}</strong> — Week ${u.week_number} — Uploaded at: ${u.uploaded_at}</li>
//       `).join('');

//       //mentor.email 
//       await transEmailApi.sendTransacEmail({
//         sender,
//         to: [{ email: mentor.email}],
//         subject: `Reminder: ${uploads.length} pending reviews`,
//         htmlContent: `
//           <p>Dear ${mentor.title} ${mentor.name},</p>
//           <p>You have <strong>${uploads.length}</strong> uploads pending review for more than 2 days.</p>
//           <ul>${uploadListHtml}</ul>
//           <p>Please log in to the mentor dashboard to review them.</p>
//           <p><a href="https://ipd-portal.onrender.com/">Go to IPD Dashboard</a></p>
//           <br>
//           <p>Best Regards,<br>IPD Team</p>
//         `,
//       });

//       console.log(`📧 Reminder sent to ${mentor.email} (${uploads.length} uploads)`);
//     }

//   } catch (error) {
//     console.error('❌ Error sending mentor review reminders:', error);
//   } finally {
//     await sequelize.close();
//   }
// }

// export default sendMentorReviewReminders;


import sequelize from './models/index.js';
import { Op } from 'sequelize';
import Mentor from './models/Mentor.js';
import User from './models/User.js';
import TeamUpload from './models/TeamUpload.js';
import Deadline from './models/Admin.js'; // ✅ your deadlines table
import Sib from 'sib-api-v3-sdk';
import dotenv from 'dotenv';

dotenv.config();

async function sendMentorReviewReminders() {
  try {
    console.log("entering mentor reminder check...");
    // 1. Find uploads older than 2 days and not reviewed
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

    const pendingUploads = await TeamUpload.findAll({
      where: {
        status: { [Op.ne]: 'REVIEWED' },
        uploaded_at: { [Op.lt]: twoDaysAgo }
      },
      include: [
        {
          model: User,
          attributes: ['UserId', 'team_name', 'mentor_id'],
          include: [
            { model: Mentor, as: 'mentor', attributes: ['mentorId', 'title', 'name', 'email'] }
          ]
        }
      ]
    });

    if (!pendingUploads.length) {
      console.log('✅ No pending reviews older than 2 days.');
    } else {
      // 2. Group uploads by mentor
      const mentorMap = {};
      for (const upload of pendingUploads) {
        const mentor = upload.User?.mentor;
        if (!mentor) continue;
        if (!mentorMap[mentor.mentorId]) {
          mentorMap[mentor.mentorId] = {
            mentor,
            uploads: []
          };
        }
        mentorMap[mentor.mentorId].uploads.push(upload);
      }

      // 3. Email mentors
      const client = Sib.ApiClient.instance;
      const apiKey = client.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_PASSWORD;
      const transEmailApi = new Sib.TransactionalEmailsApi();
      const sender = { email: process.env.EMAIL_USER, name: "IPD-TEAM" };

      for (const mentorId in mentorMap) {
        const { mentor, uploads } = mentorMap[mentorId];
        const uploadListHtml = uploads.map(u => `
          <li>Team: <strong>${u.User.team_name}</strong> — File ${u.week_number} — Uploaded at: ${u.uploaded_at}</li>
        `).join('');

        //mentor.email
        await transEmailApi.sendTransacEmail({
          sender,
          to: [{ email: mentor.email }],
          subject: `Reminder: ${uploads.length} pending reviews`,
          htmlContent: `
            <p>Dear ${mentor.title} ${mentor.name},</p>
            <p>You have <strong>${uploads.length}</strong> uploads pending review for more than 1 day.</p>
            <ul>${uploadListHtml}</ul>
            <p>Please log in to the mentor dashboard to review them.</p>
            <p><a href="https://agni-ipd.onrender.com/">Go to IPD Dashboard</a></p>
            <br>
            <p>Best Regards,<br>IPD Team</p>
          `,
        });

        console.log(`📧 Reminder sent to ${mentor.email} (${uploads.length} uploads)`);
      }
    }
  } catch (error) {
    console.error('❌ Error sending reminders:', error);
  } finally {
    await sequelize.close();
  }
}

export default sendMentorReviewReminders;
