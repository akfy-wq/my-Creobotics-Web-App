const Progress = require('../models/Progress');
const Streak = require('../models/Streak');
const SerialKey = require('../models/SerialKey');

// This should be synchronized with frontend data.js
const MODULES = require('../data/modules'); // We'll create this

exports.getProgress = async (req, res) => {
    try {
        const progress = await Progress.getAll(req.userId);
        const streak = await Streak.get(req.userId);
        
        // Get access status
        const accessGrants = await SerialKey.checkAccess(req.userId, 4);

        res.json({
            progress,
            streak: streak || { current_streak: 0, longest_streak: 0, last_active_date: null, dates: [] },
            accessGrants
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.recordAttempt = async (req, res) => {
    try {
        const { moduleId, score } = req.body;

        if (!moduleId || score === undefined) {
            return res.status(400).json({ error: 'Module ID and score are required.' });
        }

        // Check if module exists and is accessible
        const module = MODULES.find(m => m.id === moduleId);
        if (!module) {
            return res.status(404).json({ error: 'Module not found.' });
        }

        // Check if user has access to this grade
        const hasAccess = await SerialKey.checkAccess(req.userId, module.grade);
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have access to this grade.' });
        }

        const result = await Progress.recordAttempt(req.userId, moduleId, score);
        
        // Update streak on activity
        await Streak.recordDailyAccess(req.userId);

        res.json({ 
            message: 'Attempt recorded.',
            progress: await Progress.get(req.userId, moduleId)
        });
    } catch (error) {
        console.error('Record attempt error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.resetProgress = async (req, res) => {
    try {
        await Progress.reset(req.userId);
        res.json({ message: 'Progress reset successfully.' });
    } catch (error) {
        console.error('Reset progress error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.getModules = async (req, res) => {
    try {
        // Filter modules based on user's access
        const modules = await Promise.all(MODULES.map(async (m) => {
            const hasAccess = await SerialKey.checkAccess(req.userId, m.grade);
            return { ...m, accessible: hasAccess };
        }));

        res.json({ modules });
    } catch (error) {
        console.error('Get modules error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};