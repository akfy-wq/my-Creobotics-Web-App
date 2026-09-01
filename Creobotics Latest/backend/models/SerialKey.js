const pool = require('../config/database');

class SerialKey {
    static generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const group = () => 
            Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `CREO-${group()}-${group()}-${group()}`;
    }

    static async create(grade = 4, count = 1) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = this.generateCode();
            codes.push(code);
            await pool.execute(
                'INSERT INTO serial_keys (code, grade) VALUES (?, ?)',
                [code, grade]
            );
        }
        return codes;
    }

    static async redeem(code, userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM serial_keys WHERE code = ? AND used_by IS NULL',
            [code]
        );
        
        if (rows.length === 0) {
            return { error: 'Invalid or already used serial key.' };
        }

        const key = rows[0];
        const grade = key.grade;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // Mark key as used
        await pool.execute(
            'UPDATE serial_keys SET used_by = ?, used_at = NOW() WHERE code = ?',
            [userId, code]
        );

        // Create or update access grant
        await pool.execute(
            `INSERT INTO access_grants (user_id, grade, serial_key, expires_at)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE serial_key = ?, expires_at = ?`,
            [userId, grade, code, expiresAt, code, expiresAt]
        );

        return { success: true, grade, expiresAt };
    }

    static async list() {
        const [rows] = await pool.execute(
            `SELECT sk.*, u.email as used_by_email 
             FROM serial_keys sk
             LEFT JOIN users u ON sk.used_by = u.id
             ORDER BY sk.created_at DESC`
        );
        return rows;
    }

    static async checkAccess(userId, grade) {
        const [rows] = await pool.execute(
            'SELECT * FROM access_grants WHERE user_id = ? AND grade = ? AND expires_at > NOW()',
            [userId, grade]
        );
        return rows.length > 0;
    }
}

module.exports = SerialKey;