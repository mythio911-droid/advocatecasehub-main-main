const cron = require('node-cron');
const db = require('../config/db');
const { collection, query, where, getDocs, updateDoc, doc, getDoc } = require('firebase/firestore');
const { sendWhatsAppReminder } = require('./reminderService');
const nodemailer = require('nodemailer');

const checkAndSendReminders = async () => {
    console.log(`\n⏰ [${new Date().toLocaleString()}] Running reminder scheduler...`);

    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = tomorrow.toISOString().split('T')[0];

        console.log(`🔍 Checking for events on: ${tomorrowKey}`);

        const eventsRef = collection(db, "events");
        const q = query(
            eventsRef,
            where("dateKey", "==", tomorrowKey),
            where("reminder_enabled", "==", true),
            where("reminder_sent", "==", false)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('📭 No reminders to send for tomorrow.');
            return;
        }

        // Prepare Email Transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        console.log(`📬 Found ${snapshot.size} reminder(s) to process.`);

        for (const eventDoc of snapshot.docs) {
            const event = eventDoc.data();
            const eventId = eventDoc.id;

            try {
                const userDocRef = doc(db, "users", event.userId);
                const userSnapshot = await getDoc(userDocRef);

                if (!userSnapshot.exists()) {
                    console.error(`❌ User not found for event ${eventId}`);
                    continue;
                }

                const userData = userSnapshot.data();

                // 1. Send WhatsApp
                if (userData.phone_number) {
                    await sendWhatsAppReminder(
                        userData.phone_number,
                        userData.name || 'User',
                        event.title,
                        event.dateKey,
                        event.time,
                        event.description || ''
                    );
                }

                // 2. Send Email
                if (userData.email || event.email) {
                    const targetEmail = event.email || userData.email;
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: targetEmail,
                        subject: `Court Hearing Reminder: ${event.title}`,
                        text: `Hello ${userData.name || 'User'},\n\nThis is a reminder for your event tomorrow:\n\nTitle: ${event.title}\nDate: ${event.dateKey}\nTime: ${event.time}\n\nPlease ensure your presence.\n\nSent by Advocate Case Hub`,
                    });
                    console.log(`📧 Email sent to ${targetEmail}`);
                }

                // Mark as sent
                await updateDoc(doc(db, "events", eventId), {
                    reminder_sent: true
                });

            } catch (err) {
                console.error(`❌ Failed for event [${eventId}]: ${err.message}`);
            }
        }

    } catch (err) {
        console.error('❌ Scheduler error:', err.message);
    }
};

// Schedule: every day at 9:00 AM
const startScheduler = () => {
    cron.schedule('0 9 * * *', checkAndSendReminders, {
        timezone: 'Asia/Kolkata' // change to your timezone
    });
    console.log('🕘 Reminder scheduler started — runs daily at 9:00 AM IST');
};

module.exports = { startScheduler, checkAndSendReminders };
