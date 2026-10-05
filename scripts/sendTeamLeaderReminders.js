// scripts/sendMentorReviewReminders.js
import sendTeamLeaderReminders from '../sendTeamLeaderReminders.js';

sendTeamLeaderReminders().then(() => {
  console.log("✅ Reminder job finished");
  process.exit();
});
