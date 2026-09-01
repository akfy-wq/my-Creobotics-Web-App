const pool = require('../config/database');

class Progress {
    static async get(userId, moduleId) {
        const [rows] = await pool.execute(
            'SELECT * FROM progress WHERE user_id = ? AND module_id = ?',
            [userId, moduleId]
        );
        return rows[0] || null;
    }

    static async getAll(userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM progress WHERE user_id = ?',
            [userId]
        );
        return rows;
    }

    static async updateOrCreate(userId, moduleId, data) {
        const { best_score, attempts, completed, history } = data;
        
        const existing = await this.get(userId, moduleId);
        
        if (existing) {
            const [result] = await pool.execute(
                `UPDATE progress 
                 SET best_score = ?, attempts = ?, completed = ?, history = ?
                 WHERE user_id = ? AND module_id = ?`,
                [best_score, attempts, completed, JSON.stringify(history), userId, moduleId]
            );
            return result;
        } else {
            const [result] = await pool.execute(
                `INSERT INTO progress (user_id, module_id, best_score, attempts, completed, history)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, moduleId, best_score, attempts, completed, JSON.stringify(history)]
            );
            return result;
        }
    }

    static async recordAttempt(userId, moduleId, score) {
        const existing = await this.get(userId, moduleId);
        let history = [];
        
        if (existing) {
            try {
                history = existing.history ? JSON.parse(existing.history) : [];
            } catch (e) {
                history = [];
            }
        }
        history.push(score);
        
        const best_score = existing ? Math.max(existing.best_score || 0, score) : score;
        const attempts = existing ? (existing.attempts || 0) + 1 : 1;
        const completed = score >= 80;
        
        return await this.updateOrCreate(userId, moduleId, {
            best_score,
            attempts,
            completed,
            history
        });
    }

    static async reset(userId) {
        const [result] = await pool.execute(
            'DELETE FROM progress WHERE user_id = ?',
            [userId]
        );
        return result;
    }

    // Get progress with proper JSON parsing
    static async getProgressWithHistory(userId) {
        const rows = await this.getAll(userId);
        return rows.map(row => ({
            ...row,
            history: row.history ? JSON.parse(row.history) : []
        }));
    }
}

module.exports = Progress;