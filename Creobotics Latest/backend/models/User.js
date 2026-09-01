const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { email, password, name, school, role = 'student' } = userData;
        const passwordHash = await bcrypt.hash(password, 10);
        
        const [result] = await pool.execute(
            `INSERT INTO users (email, password_hash, name, school, role) 
             VALUES (?, ?, ?, ?, ?)`,
            [email, passwordHash, name, school, role]
        );
        
        return { id: result.insertId, email, name, school, role };
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, email, name, school, role, avatar_id, nickname, profile_complete, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async update(id, data) {
        const { name, school, avatar_id, nickname, profile_complete } = data;
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (school !== undefined) { updates.push('school = ?'); values.push(school); }
        if (avatar_id !== undefined) { updates.push('avatar_id = ?'); values.push(avatar_id); }
        if (nickname !== undefined) { updates.push('nickname = ?'); values.push(nickname); }
        if (profile_complete !== undefined) { updates.push('profile_complete = ?'); values.push(profile_complete); }

        if (updates.length === 0) return null;

        values.push(id);
        const [result] = await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        return result;
    }

    static async updatePassword(id, newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        const [result] = await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, id]
        );
        return result;
    }

    static async verifyPassword(email, password) {
        const user = await this.findByEmail(email);
        if (!user) return false;
        return await bcrypt.compare(password, user.password_hash);
    }
}

module.exports = User;