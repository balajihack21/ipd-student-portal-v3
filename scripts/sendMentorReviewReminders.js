// scripts/sendMentorReviewReminders.js
import sendMentorReviewReminders from '../sendMentorReviewReminders.js';

sendMentorReviewReminders().then(() => {
  console.log("✅ Reminder job finished");
  process.exit();
});
