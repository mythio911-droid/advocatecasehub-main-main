const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const { startScheduler } = require('./services/schedulerService');

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: '✅ Calendar Reminder API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    startScheduler(); // start daily cron job
});
