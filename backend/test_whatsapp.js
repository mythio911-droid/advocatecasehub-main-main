const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppReminder = async (phoneNumber, userName, eventTitle) => {
    const messageBody = `Hello ${userName}! 👋\n\n📅 *Event Reminder*\n\nThis is a manual test of your WhatsApp reminder system via Firebase backend.\n\n🗓 *${eventTitle}*\n\nHave a great day! ✅`;

    try {
        const message = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: `whatsapp:${phoneNumber}`,
            body: messageBody,
        });
        console.log(`✅ Success! Message SID: ${message.sid}`);
        console.log(`📱 Sent to: ${phoneNumber}`);
    } catch (err) {
        console.error(`❌ Failed: ${err.message}`);
    }
};

// --- TEST CONFIGURATION ---
const YOUR_PHONE = '+91XXXXXXXXXX'; // <-- CHANGE TO YOUR NUMBER
const YOUR_NAME = 'Advocate';
// --------------------------

if (YOUR_PHONE === '+91XXXXXXXXXX') {
    console.log('⚠️ Please edit backend/test_whatsapp.js and set your real WhatsApp number.');
} else {
    console.log('🚀 Starting manual WhatsApp test...');
    sendWhatsAppReminder(YOUR_PHONE, YOUR_NAME, 'Firebase Integration Test');
}
