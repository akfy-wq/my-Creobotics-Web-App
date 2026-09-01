const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit'); // Commented out for development
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const pool = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
});

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000'],
    credentials: true
}));

// Rate limiting - DISABLED FOR DEVELOPMENT
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100
// });
// app.use('/api', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Load route files with absolute paths
console.log('📂 Loading route files...');
console.log(`📂 Current directory: ${__dirname}`);

try {
    const authRoutes = require(path.join(__dirname, 'routes', 'auth'));
    console.log('✅ Auth routes loaded');
    app.use('/api/auth', authRoutes);
} catch (error) {
    console.error('❌ Error loading auth routes:', error.message);
}

try {
    const progressRoutes = require(path.join(__dirname, 'routes', 'progress'));
    console.log('✅ Progress routes loaded');
    app.use('/api/progress', progressRoutes);
} catch (error) {
    console.error('❌ Error loading progress routes:', error.message);
}

try {
    const adminRoutes = require(path.join(__dirname, 'routes', 'admin'));
    console.log('✅ Admin routes loaded');
    app.use('/api/admin', adminRoutes);
} catch (error) {
    console.error('❌ Error loading admin routes:', error.message);
}

// ============================================================
// SERIAL KEY REDEMPTION + ACCESS STATUS
// Added directly here (self-contained, no controller/model
// dependency) because neither routes/progress.js nor
// routes/admin.js currently exposes a student-facing redeem
// endpoint at the path the frontend (api.js) actually calls:
//   POST /api/serial/redeem
//   GET  /api/access/status
// ============================================================

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
}

app.post('/api/serial/redeem', verifyToken, async (req, res) => {
    try {
        const code = (req.body.code || '').trim().toUpperCase();
        if (!code) {
            return res.status(400).json({ error: 'Enter a serial key.' });
        }

        const [keys] = await pool.execute(
            'SELECT * FROM serial_keys WHERE code = ? AND used_by IS NULL',
            [code]
        );
        if (keys.length === 0) {
            return res.status(400).json({ error: "That serial key isn't valid or has already been used." });
        }

        const key = keys[0];
        const grade = key.grade || 4;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await pool.execute(
            'UPDATE serial_keys SET used_by = ?, used_at = NOW() WHERE id = ?',
            [req.userId, key.id]
        );

        await pool.execute(
            `INSERT INTO access_grants (user_id, grade, serial_key, expires_at)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE serial_key = ?, expires_at = ?, activated_at = NOW()`,
            [req.userId, grade, code, expiresAt, code, expiresAt]
        );

        console.log(`✅ Serial key ${code} redeemed by user ${req.userId} — Grade ${grade} unlocked until ${expiresAt.toISOString()}`);
        res.json({ success: true, grade, expiresAt });
    } catch (error) {
        console.error('❌ Redeem serial key error:', error);
        res.status(500).json({ error: 'Server error redeeming key.' });
    }
});

app.get('/api/access/status', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT grade, expires_at FROM access_grants WHERE user_id = ? ORDER BY expires_at DESC LIMIT 1',
            [req.userId]
        );
        if (rows.length === 0) {
            return res.json({ hasAccess: false, expiresAt: null });
        }
        const expiresAt = new Date(rows[0].expires_at);
        const hasAccess = expiresAt > new Date();
        res.json({
            hasAccess,
            grade: rows[0].grade,
            expiresAt: expiresAt.toISOString(),
            daysRemaining: Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
        });
    } catch (error) {
        console.error('❌ Access status error:', error);
        res.status(500).json({ error: 'Server error checking access.' });
    }
});

// 404 handler
app.use((req, res) => {
    console.log(`❌ 404: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Route not found',
        path: req.url,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Creobotics backend running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Auth test: http://localhost:${PORT}/api/auth/test`);
    console.log(`📝 Progress test: http://localhost:${PORT}/api/progress/test`);
    console.log(`📝 Admin test: http://localhost:${PORT}/api/admin/test`);
});