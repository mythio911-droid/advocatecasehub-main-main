const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppReminder = async (phoneNumber, userName, eventTitle, eventDate, eventTime, eventDescription) => {
    const formattedDate = new Date(eventDate).toDateString();
    const formattedTime = eventTime || 'All day';
    const notes = eventDescription || 'No additional notes';

    const messageBody =
        `Hello ${userName}! 👋

📅 *Event Reminder*

You have an upcoming event tomorrow:

🗓 *${eventTitle}*
📆 Date: ${formattedDate}
⏰ Time: ${formattedTime}
📝 Notes: ${notes}

Have a great day! ✅
_Sent by your Calendar App_`;

    const message = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${phoneNumber}`,
        body: messageBody,
    });

    console.log(`✅ WhatsApp sent to ${phoneNumber} | SID: ${message.sid}`);
    return message;
};

module.exports = { sendWhatsAppReminder };
