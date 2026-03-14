const express = require('express');
const db = require('../config/db');
const { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, orderBy } = require('firebase/firestore');
const authenticate = require('../middleware/auth');
const { sendWhatsAppReminder } = require('../services/reminderService');
const router = express.Router();

// GET all events for logged-in user (Firebase userId is passed in auth middleware)
router.get('/', authenticate, async (req, res) => {
    try {
        const q = query(
            collection(db, "events"),
            where("userId", "==", req.user.id),
            orderBy("dateKey", "asc")
        );
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE event
router.post('/', authenticate, async (req, res) => {
    const { title, description, dateKey, time, type, reminder_enabled } = req.body;

    if (!title || !dateKey) {
        return res.status(400).json({ error: 'Title and dateKey (YYYY-MM-DD) are required.' });
    }

    try {
        const userDoc = await getDoc(doc(db, "users", req.user.id));
        if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });
        const user = userDoc.data();

        if (reminder_enabled && !user.phone_number) {
            return res.status(400).json({
                error: 'No phone number on your account. Please update your profile to use WhatsApp reminders.'
            });
        }

        const docRef = await addDoc(collection(db, "events"), {
            userId: req.user.id,
            title,
            description: description || '',
            dateKey,
            time: time || '',
            type: type || 'hearing',
            reminder_enabled: reminder_enabled || false,
            reminder_sent: false,
            created_at: new Date().toISOString()
        });

        res.status(201).json({ id: docRef.id, title, dateKey });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE event
router.put('/:id', authenticate, async (req, res) => {
    const { title, description, dateKey, time, type, reminder_enabled } = req.body;

    try {
        const eventRef = doc(db, "events", req.params.id);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists() || eventSnap.data().userId !== req.user.id) {
            return res.status(404).json({ error: 'Event not found or unauthorized.' });
        }

        await updateDoc(eventRef, {
            title, description, dateKey, time, type,
            reminder_enabled,
            reminder_sent: false // Reset flag if updated
        });

        res.json({ success: true, message: 'Event updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE event
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const eventRef = doc(db, "events", req.params.id);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists() || eventSnap.data().userId !== req.user.id) {
            return res.status(404).json({ error: 'Event not found or unauthorized.' });
        }

        await deleteDoc(eventRef);
        res.json({ success: true, message: 'Event deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TEST — manually send WhatsApp reminder for a specific event
router.post('/test-reminder/:id', authenticate, async (req, res) => {
    try {
        const eventRef = doc(db, "events", req.params.id);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists() || eventSnap.data().userId !== req.user.id) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        const event = eventSnap.data();

        const userDoc = await getDoc(doc(db, "users", req.user.id));
        const user = userDoc.data();

        if (!user.phone_number) {
            return res.status(400).json({ error: 'No phone number on account.' });
        }

        const msg = await sendWhatsAppReminder(
            user.phone_number,
            user.name || 'User',
            event.title,
            event.dateKey,
            event.time,
            event.description
        );

        res.json({ success: true, sid: msg.sid, sentTo: user.phone_number });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TRIGGER — manually run the scheduler logic for testing
router.get('/trigger-reminders', async (req, res) => {
    try {
        const { checkAndSendReminders } = require('../services/schedulerService');
        await checkAndSendReminders();
        res.json({ success: true, message: 'Scheduler triggered manually' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MANUAL — send specific text to specific phone (used by frontend service)
router.post('/test-reminder-manual', async (req, res) => {
    const { to, body } = req.body;

    if (!to || !body) return res.status(400).json({ error: "Missing 'to' or 'body'" });

    try {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const message = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_FROM, // Using WhatsApp as requested earlier
            to: `whatsapp:${to}`,
            body: body,
        });

        res.json({ success: true, sid: message.sid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

