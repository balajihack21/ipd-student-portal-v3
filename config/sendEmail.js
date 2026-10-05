// mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,     // your Brevo email
    pass: process.env.EMAIL_PASSWORD, // your Brevo SMTP password
  },
});

module.exports = transporter;
