const pool = require('../config/database');

class Streak {
    static async get(userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM streaks WHERE user_id = ?',
            [userId]
        );
        if (rows[0]) {
            // Parse dates if they exist
            if (rows[0].dates) {
                try {
                    rows[0].dates = JSON.parse(rows[0].dates);
                } catch (e) {
                    rows[0].dates = [];
                }
            } else {
                rows[0].dates = [];
            }
        }
        return rows[0] || null;
    }

    static async recordDailyAccess(userId) {
        const today = new Date().toISOString().split('T')[0];
        const existing = await this.get(userId);
        
        if (existing && existing.last_active_date === today) {
            return existing;
        }

        let currentStreak = 1;
        let longestStreak = existing ? (existing.longest_streak || 0) : 0;
        let dates = existing ? (existing.dates || []) : [];

        if (existing && existing.last_active_date) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (existing.last_active_date === yesterdayStr) {
                currentStreak = (existing.current_streak || 0) + 1;
            }
            longestStreak = Math.max(longestStreak, currentStreak);
        }

        dates.push(today);
        if (dates.length > 400) dates = dates.slice(-400);

        if (existing) {
            const [result] = await pool.execute(
                `UPDATE streaks 
                 SET current_streak = ?, longest_streak = ?, last_active_date = ?, dates = ?
                 WHERE user_id = ?`,
                [currentStreak, longestStreak, today, JSON.stringify(dates), userId]
            );
            return { 
                user_id: userId, 
                current_streak: currentStreak, 
                longest_streak: longestStreak, 
                last_active_date: today, 
                dates 
            };
        } else {
            const [result] = await pool.execute(
                `INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date, dates)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, currentStreak, longestStreak, today, JSON.stringify(dates)]
            );
            return { 
                user_id: userId, 
                current_streak: currentStreak, 
                longest_streak: longestStreak, 
                last_active_date: today, 
                dates 
            };
        }
    }
}

module.exports = Streak;