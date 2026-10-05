import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js'
import authenticate from '../middleware/authenticate.js';
import Admin from '../models/Admin.js';
import Sib from "sib-api-v3-sdk";

const router = express.Router();



router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Admin check
    const admin = await Admin.findOne({ where: { email } });
    if (admin) {
      if (admin.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ adminId: admin.adminId }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.json({ token, role: "admin" });
    }

    // 2️⃣ Student check
    const user = await User.findOne({ where: { email } });
    if (user) {
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.firstLogin) {
        return res.json({ firstLogin: true, role: "student", userId: user.UserId });
      }
      const token = jwt.sign({ userId: user.UserId }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.json({ token, role: "student" });
    }

    // 3️⃣ Mentor check
    const mentor = await Mentor.findOne({ where: { email } });
    if (mentor) {
      if (mentor.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (mentor.firstLogin) {
        return res.json({ firstLogin: true, role: "mentor", userId: mentor.mentorId });
      }
      const token = jwt.sign({ mentorId: mentor.mentorId }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.json({ token, role: "mentor" });
    }

    return res.status(404).json({ message: "User not found" });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    // Admin check
    // const admin = await Admin.findByPk(userId);
    // if (admin) {
    //   admin.password = newPassword;
    //   await admin.save();
    //   return res.json({ message: "Password updated successfully", role: "admin" });
    // }

    // Student check
    const user = await User.findByPk(userId);
    if (user) {
      user.password = newPassword;
      user.firstLogin = false;
      await user.save();
      return res.json({ message: "Password updated successfully", role: "student" });
    }

    // Mentor check
    const mentor = await Mentor.findByPk(userId);
    if (mentor) {
      mentor.password = newPassword;
      mentor.firstLogin = false;
      await mentor.save();
      return res.json({ message: "Password updated successfully", role: "mentor" });
    }

    return res.status(404).json({ message: "User not found" });

  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




// Sendinblue setup
const client = Sib.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.EMAIL_PASSWORD;
const transEmailApi = new Sib.TransactionalEmailsApi();
const sender = {
  email: process.env.EMAIL_USER,
  name: "IPD-TEAM",
};

// 1️⃣ Forgot Password - send email
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // check in all three roles
    let user =
      (await User.findOne({ where: { email } })) ||
      (await Mentor.findOne({ where: { email } }));

    if (!user) {
      return res.status(404).json({ message: "No account with this email" });
    }

    // Generate token (valid for 15 mins)
    const token = jwt.sign({ id: user.UserId || user.mentorId || user.adminId, email }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `http://agni-ipd.onrender.com/reset-password.html?token=${token}`;

    // Send email
    console.log(user.email)
    await transEmailApi.sendTransacEmail({
      sender,
      to: [{ email:user.email }],
      subject: "Password Reset Request - IPD",
      htmlContent: `
        <h3>Hello,</h3>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetLink}" target="_blank">Reset Password</a></p>
        <p>If you didn’t request this, please ignore.</p>
      `,
    });

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2️⃣ Reset password with token
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, email } = decoded;

    // check who the user is
    let user =
      (await User.findOne({ where: { email } })) ||
      (await Mentor.findOne({ where: { email } })) ||
      (await Admin.findOne({ where: { email } }));

    if (!user) return res.status(404).json({ message: "User not found" });

    // Update password
    user.password = newPassword;
    user.firstLogin = false;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});



export default router;
