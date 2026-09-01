const SerialKey = require('../models/SerialKey');
const User = require('../models/User');
const Progress = require('../models/Progress');

exports.generateSerialKeys = async (req, res) => {
    try {
        const { count = 1, grade = 4 } = req.body;
        
        if (count < 1 || count > 100) {
            return res.status(400).json({ error: 'Count must be between 1 and 100.' });
        }

        const codes = await SerialKey.create(grade, count);
        res.json({ 
            message: `${count} serial key(s) generated.`,
            keys: codes 
        });
    } catch (error) {
        console.error('Generate serial keys error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.listSerialKeys = async (req, res) => {
    try {
        const keys = await SerialKey.list();
        res.json({ keys });
    } catch (error) {
        console.error('List serial keys error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        // This would need a paginated query in production
        // For now, let's get all users (limit to 100 for performance)
        const pool = require('../config/database');
        const [rows] = await pool.execute(
            `SELECT id, email, name, school, role, avatar_id, nickname, profile_complete, created_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT 100`
        );
        res.json({ users: rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.getUserProgress = async (req, res) => {
    try {
        const { userId } = req.params;
        const progress = await Progress.getAll(userId);
        res.json({ progress });
    } catch (error) {
        console.error('Get user progress error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const pool = require('../config/database');
        
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
};const SerialKey = require('../models/SerialKey');
const User = require('../models/User');
const Progress = require('../models/Progress');

exports.generateSerialKeys = async (req, res) => {
    try {
        const { count = 1, grade = 4 } = req.body;
        
        if (count < 1 || count > 100) {
            return res.status(400).json({ error: 'Count must be between 1 and 100.' });
        }

        const codes = await SerialKey.create(grade, count);
        res.json({ 
            message: `${count} serial key(s) generated.`,
            keys: codes 
        });
    } catch (error) {
        console.error('Generate serial keys error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.listSerialKeys = async (req, res) => {
    try {
        const keys = await SerialKey.list();
        res.json({ keys });
    } catch (error) {
        console.error('List serial keys error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        // This would need a paginated query in production
        // For now, let's get all users (limit to 100 for performance)
        const pool = require('../config/database');
        const [rows] = await pool.execute(
            `SELECT id, email, name, school, role, avatar_id, nickname, profile_complete, created_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT 100`
        );
        res.json({ users: rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.getUserProgress = async (req, res) => {
    try {
        const { userId } = req.params;
        const progress = await Progress.getAll(userId);
        res.json({ progress });
    } catch (error) {
        console.error('Get user progress error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const pool = require('../config/database');
        
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
};