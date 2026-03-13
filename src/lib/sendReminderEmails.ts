import nodemailer from "nodemailer";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const sendReminderEmails = async () => {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

  try {
    const q = query(collection(db, "events"), where("dateKey", "==", dateKey));
    const snapshot = await getDocs(q);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Use environment variables
        pass: process.env.EMAIL_PASS, // Use environment variables
      },
    });

    const emailsToSend = [];

    snapshot.forEach((doc) => {
      const event = doc.data();
      if (event.email) {
        emailsToSend.push(
          transporter.sendMail({
            from: process.env.EMAIL_USER, // Use environment variables
            to: event.email,
            subject: `Reminder: ${event.title}`,
            text: `You have an event scheduled today at ${event.time}: ${event.title}`,
          })
        );
      }
    });

    await Promise.all(emailsToSend);
    console.log("Reminder emails sent successfully");
  } catch (error) {
    console.error("Error sending reminder emails:", error);
  }
};

export default sendReminderEmails;