const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

// Simple test route
router.get('/test', (req, res) => {
    res.json({ message: 'Admin routes working' });
});

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        pool.execute('SELECT role FROM users WHERE id = ?', [decoded.id])
            .then(([users]) => {
                if (users.length === 0 || users[0].role !== 'admin') {
                    return res.status(403).json({ error: 'Admin access required.' });
                }
                req.userId = decoded.id;
                next();
            })
            .catch(err => {
                console.error('Admin check error:', err);
                res.status(500).json({ error: 'Server error.' });
            });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

// Generate serial keys
router.post('/serial-keys', verifyAdmin, async (req, res) => {
    try {
        const { count = 1, grade = 4 } = req.body;
        
        if (count < 1 || count > 100) {
            return res.status(400).json({ error: 'Count must be between 1 and 100.' });
        }
        
        const codes = [];
        for (let i = 0; i < count; i++) {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const group = () => 
                Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            const code = `CREO-${group()}-${group()}-${group()}`;
            codes.push(code);
            await pool.execute(
                'INSERT INTO serial_keys (code, grade) VALUES (?, ?)',
                [code, grade]
            );
        }
        
        res.json({ 
            message: `${count} serial key(s) generated.`,
            keys: codes 
        });
    } catch (error) {
        console.error('Generate serial keys error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// List serial keys
router.get('/serial-keys', verifyAdmin, async (req, res) => {
    try {
        const [keys] = await pool.execute(
            `SELECT sk.*, u.email as used_by_email 
             FROM serial_keys sk
             LEFT JOIN users u ON sk.used_by = u.id
             ORDER BY sk.created_at DESC`
        );
        res.json({ keys });
    } catch (error) {
        console.error('List serial keys error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Get users
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, email, name, school, role, avatar_id, nickname, profile_complete, created_at FROM users ORDER BY created_at DESC LIMIT 100'
        );
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Get user progress
router.get('/users/:userId/progress', verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const [progress] = await pool.execute(
            'SELECT * FROM progress WHERE user_id = ?',
            [userId]
        );
        res.json({ progress });
    } catch (error) {
        console.error('Get user progress error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Get stats
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [totalKeys] = await pool.execute('SELECT COUNT(*) as count FROM serial_keys');
        const [usedKeys] = await pool.execute('SELECT COUNT(*) as count FROM serial_keys WHERE used_by IS NOT NULL');
        const [totalProgress] = await pool.execute('SELECT COUNT(*) as count FROM progress');
        const [completedModules] = await pool.execute('SELECT COUNT(*) as count FROM progress WHERE completed = TRUE');
        
        res.json({
            stats: {
                totalUsers: totalUsers[0].count,
                totalSerialKeys: totalKeys[0].count,
                usedSerialKeys: usedKeys[0].count,
                totalProgressEntries: totalProgress[0].count,
                completedModules: completedModules[0].count
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;