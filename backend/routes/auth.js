const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();
require('dotenv').config();

// REGISTER
router.post('/register', async (req, res) => {
    const { name, email, password, phone_number } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Validate phone number format (E.164)
    if (phone_number) {
        const phoneRegex = /^\+[1-9]\d{7,14}$/;
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ error: 'Phone number must be in format: +91XXXXXXXXXX' });
        }
    }

    try {
        // Check if user already exists
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await db.query(
            `INSERT INTO users (name, email, password, phone_number)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone_number`,
            [name, email, hashedPassword, phone_number || null]
        );

        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, phone_number: user.phone_number },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ token, user });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, phone_number: user.phone_number },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, phone_number: user.phone_number }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// UPDATE PHONE NUMBER
router.put('/update-phone', require('../middleware/auth'), async (req, res) => {
    const { phone_number } = req.body;
    const phoneRegex = /^\+[1-9]\d{7,14}$/;

    if (!phoneRegex.test(phone_number)) {
        return res.status(400).json({ error: 'Invalid phone format. Use +91XXXXXXXXXX' });
    }

    try {
        await db.query(
            'UPDATE users SET phone_number = $1 WHERE id = $2',
            [phone_number, req.user.id]
        );
        res.json({ success: true, message: 'Phone number updated.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update phone number.' });
    }
});

module.exports = router;
