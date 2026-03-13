import express from "express";
import bodyParser from "body-parser";
import cron from "node-cron";
import nodemailer from "nodemailer";

const app = express();
app.use(bodyParser.json());

// In-memory database for storing events (replace with a real database in production)
const events: { email: string; date: string; title: string }[] = [];

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service provider
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

// API to add a new calendar event
app.post("/add-event", (req, res) => {
  const { email, date, title } = req.body;

  if (!email || !date || !title) {
    return res.status(400).json({ message: "Email, date, and title are required." });
  }

  events.push({ email, date, title });
  res.status(200).json({ message: "Event added successfully." });
});

// Function to send reminder emails
const sendReminderEmail = async (email: string, title: string, date: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Event Reminder Notification",
    text: `This is a reminder for your event \"${title}\" scheduled on ${date}. Please be prepared.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
  }
};

// Schedule a cron job to run daily at 8:00 AM
cron.schedule("0 8 * * *", () => {
  console.log("Running daily reminder email job...");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split("T")[0];

  events.forEach((event) => {
    if (event.date === tomorrowDate) {
      sendReminderEmail(event.email, event.title, event.date);
    }
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});