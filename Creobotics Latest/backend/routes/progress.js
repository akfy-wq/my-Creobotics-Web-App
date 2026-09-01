const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

// ============================================================
// TEST ROUTE - For debugging
// ============================================================
router.get('/test', (req, res) => {
    res.json({ message: 'Progress routes working' });
});

// ============================================================
// MIDDLEWARE - Verify token
// ============================================================
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        console.error('❌ Token verification error:', error);
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

// ============================================================
// GET ALL PROGRESS - Get all progress for current user
// Also returns access grants for the user
// ============================================================
router.get('/', verifyToken, async (req, res) => {
    try {
        console.log(`📊 Getting progress for user: ${req.userId}`);
        
        // Get user progress
        const [progress] = await pool.execute(
            'SELECT * FROM progress WHERE user_id = ?',
            [req.userId]
        );
        
        // Get access grants
        const [accessGrants] = await pool.execute(
            'SELECT * FROM access_grants WHERE user_id = ? AND expires_at > NOW()',
            [req.userId]
        );
        
        // Parse history for each progress entry
        const parsedProgress = progress.map(p => {
            let history = [];
            if (p.history) {
                try {
                    if (typeof p.history === 'string') {
                        history = JSON.parse(p.history);
                    } else if (Array.isArray(p.history)) {
                        history = p.history;
                    }
                } catch (e) {
                    history = [];
                }
            }
            return {
                ...p,
                history: history
            };
        });
        
        console.log(`📊 User ${req.userId} has ${parsedProgress.length} progress entries and ${accessGrants.length} active access grants`);
        
        res.json({ 
            progress: parsedProgress,
            accessGrants
        });
    } catch (error) {
        console.error('❌ Get progress error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// RECORD QUIZ ATTEMPT - Record a quiz attempt
// ============================================================
router.post('/attempt', verifyToken, async (req, res) => {
    try {
        const { moduleId, score } = req.body;
        
        console.log(`📝 Recording attempt for user ${req.userId}, module ${moduleId}, score ${score}`);
        
        if (!moduleId || score === undefined) {
            return res.status(400).json({ error: 'Module ID and score are required.' });
        }
        
        if (score < 0 || score > 100) {
            return res.status(400).json({ error: 'Score must be between 0 and 100.' });
        }
        
        // Get existing progress
        const [existing] = await pool.execute(
            'SELECT * FROM progress WHERE user_id = ? AND module_id = ?',
            [req.userId, moduleId]
        );
        
        let history = [];
        let bestScore = score;
        let attempts = 1;
        let completed = score >= 80;
        
        if (existing.length > 0) {
            // Parse history - handle both array and string
            if (existing[0].history) {
                try {
                    if (typeof existing[0].history === 'string') {
                        history = JSON.parse(existing[0].history);
                    } else if (Array.isArray(existing[0].history)) {
                        history = existing[0].history;
                    } else {
                        history = [];
                    }
                } catch (e) {
                    history = [];
                }
            }
            
            // Ensure history is an array
            if (!Array.isArray(history)) {
                history = [];
            }
            
            history.push(score);
            bestScore = Math.max(existing[0].best_score || 0, score);
            attempts = (existing[0].attempts || 0) + 1;
            completed = score >= 80 || existing[0].completed || false;
        } else {
            history = [score];
        }
        
        // Ensure history is an array and convert to JSON string
        const historyJSON = JSON.stringify(history);
        
        if (existing.length > 0) {
            await pool.execute(
                `UPDATE progress 
                 SET best_score = ?, attempts = ?, completed = ?, history = ?
                 WHERE user_id = ? AND module_id = ?`,
                [bestScore, attempts, completed ? 1 : 0, historyJSON, req.userId, moduleId]
            );
        } else {
            await pool.execute(
                `INSERT INTO progress (user_id, module_id, best_score, attempts, completed, history)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.userId, moduleId, bestScore, attempts, completed ? 1 : 0, historyJSON]
            );
        }
        
        console.log(`✅ Attempt recorded successfully. Completed: ${completed}, Best score: ${bestScore}, Attempts: ${attempts}`);
        
        // Get the updated progress to return
        const [updated] = await pool.execute(
            'SELECT * FROM progress WHERE user_id = ? AND module_id = ?',
            [req.userId, moduleId]
        );
        
        const progressData = updated[0];
        
        // Parse history for response
        let responseHistory = [];
        if (progressData.history) {
            try {
                if (typeof progressData.history === 'string') {
                    responseHistory = JSON.parse(progressData.history);
                } else if (Array.isArray(progressData.history)) {
                    responseHistory = progressData.history;
                }
            } catch (e) {
                responseHistory = [];
            }
        }
        
        res.json({ 
            message: 'Attempt recorded.',
            progress: { 
                moduleId: progressData.module_id,
                bestScore: progressData.best_score,
                attempts: progressData.attempts,
                completed: !!progressData.completed,
                history: responseHistory
            }
        });
    } catch (error) {
        console.error('❌ Record attempt error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ============================================================
// RESET PROGRESS - Reset all progress for current user
// ============================================================
router.delete('/reset', verifyToken, async (req, res) => {
    try {
        console.log(`🔄 Resetting progress for user: ${req.userId}`);
        
        await pool.execute('DELETE FROM progress WHERE user_id = ?', [req.userId]);
        
        console.log(`✅ Progress reset for user: ${req.userId}`);
        res.json({ message: 'Progress reset successfully.' });
    } catch (error) {
        console.error('❌ Reset progress error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// GET MODULES - Get all modules
// ============================================================
router.get('/modules', verifyToken, async (req, res) => {
    try {
        console.log(`📚 Getting modules for user: ${req.userId}`);
        
        const [modules] = await pool.execute('SELECT * FROM modules ORDER BY id');
        
        console.log(`📚 Found ${modules.length} modules`);
        res.json({ modules });
    } catch (error) {
        console.error('❌ Get modules error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// REDEEM SERIAL KEY - Redeem a serial key
// ============================================================
router.post('/redeem', verifyToken, async (req, res) => {
    try {
        const { code } = req.body;
        
        console.log(`🔑 Redeeming serial key for user ${req.userId}: ${code}`);
        
        if (!code) {
            return res.status(400).json({ error: 'Serial key is required.' });
        }
        
        // Check if key exists and is unused
        const [keys] = await pool.execute(
            'SELECT * FROM serial_keys WHERE code = ? AND used_by IS NULL',
            [code]
        );
        
        if (keys.length === 0) {
            console.log(`❌ Invalid or already used serial key: ${code}`);
            return res.status(400).json({ error: 'Invalid or already used serial key.' });
        }
        
        const key = keys[0];
        const grade = key.grade || 4;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        // Mark key as used
        await pool.execute(
            'UPDATE serial_keys SET used_by = ?, used_at = NOW() WHERE code = ?',
            [req.userId, code]
        );
        
        // Check if access grant already exists for this grade
        const [existingGrant] = await pool.execute(
            'SELECT * FROM access_grants WHERE user_id = ? AND grade = ?',
            [req.userId, grade]
        );
        
        if (existingGrant.length > 0) {
            // Update existing grant
            await pool.execute(
                'UPDATE access_grants SET serial_key = ?, expires_at = ? WHERE user_id = ? AND grade = ?',
                [code, expiresAt, req.userId, grade]
            );
            console.log(`✅ Updated existing access grant for user ${req.userId}, grade ${grade}`);
        } else {
            // Create new grant
            await pool.execute(
                `INSERT INTO access_grants (user_id, grade, serial_key, expires_at)
                 VALUES (?, ?, ?, ?)`,
                [req.userId, grade, code, expiresAt]
            );
            console.log(`✅ Created new access grant for user ${req.userId}, grade ${grade}`);
        }
        
        // Get the updated access grants to return to client
        const [updatedGrants] = await pool.execute(
            'SELECT * FROM access_grants WHERE user_id = ? AND expires_at > NOW()',
            [req.userId]
        );
        
        console.log(`✅ Serial key ${code} redeemed successfully for user ${req.userId}`);
        
        res.json({ 
            message: 'Serial key redeemed successfully.',
            grade,
            expiresAt,
            accessGrants: updatedGrants
        });
    } catch (error) {
        console.error('❌ Redeem serial key error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// GET SINGLE MODULE - Get a specific module by ID
// ============================================================
router.get('/modules/:id', verifyToken, async (req, res) => {
    try {
        const moduleId = req.params.id;
        console.log(`📚 Getting module ${moduleId} for user: ${req.userId}`);
        
        const [modules] = await pool.execute(
            'SELECT * FROM modules WHERE id = ?',
            [moduleId]
        );
        
        if (modules.length === 0) {
            return res.status(404).json({ error: 'Module not found.' });
        }
        
        res.json({ module: modules[0] });
    } catch (error) {
        console.error('❌ Get module error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// GET USER STATS - Get overall user statistics
// ============================================================
router.get('/stats', verifyToken, async (req, res) => {
    try {
        console.log(`📊 Getting stats for user: ${req.userId}`);
        
        // Get total modules completed
        const [completed] = await pool.execute(
            'SELECT COUNT(*) as completed FROM progress WHERE user_id = ? AND completed = TRUE',
            [req.userId]
        );
        
        // Get total attempts
        const [attempts] = await pool.execute(
            'SELECT SUM(attempts) as total FROM progress WHERE user_id = ?',
            [req.userId]
        );
        
        // Get average score
        const [avgScore] = await pool.execute(
            'SELECT AVG(best_score) as average FROM progress WHERE user_id = ?',
            [req.userId]
        );
        
        res.json({
            stats: {
                completedModules: completed[0].completed || 0,
                totalAttempts: attempts[0].total || 0,
                averageScore: Math.round(avgScore[0].average || 0)
            }
        });
    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;