// In a real production app, verify the Firebase ID Token using firebase-admin.
// For this local demo, we expect the Firebase UID to be passed in the header.

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expecting the Firebase UID

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token (UID) provided.' });
    }

    // Simplified for local testing: treat token as the userId
    req.user = { id: token };
    next();
};

module.exports = authenticateUser;
