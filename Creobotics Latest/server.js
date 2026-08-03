// server.js - Complete Version with All Features
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

console.log('🚀 Creobotics Server Starting...');
console.log('📊 Environment:', {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'webuser',
    DB_NAME: process.env.DB_NAME || 'creobotics_db',
    PORT: process.env.PORT || 3000
});

// Error handlers
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API is working!',
        endpoints: [
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/auth/me',
            'GET /api/modules',
            'GET /api/test',
            'GET /api/teacher/students',
            'GET /api/admin/teacher-codes',
            'POST /api/admin/teacher-codes',
            'POST /api/teacher/redeem',
            'POST /api/teacher/class-code',
            'POST /api/teacher/join-class',
            'POST /api/teacher/leave-class',
            'POST /api/auth/make-admin'
        ]
    });
});

// ===== DATABASE CONNECTION =====
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'webuser',
    password: process.env.DB_PASSWORD || 'redxcyrus18',
    database: process.env.DB_NAME || 'creobotics_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

// Test database connection
async function testDB() {
    try {
        const [rows] = await db.query('SELECT 1');
        console.log('✅ MySQL connected successfully');
        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        console.log('⚠️  Make sure MySQL is running and credentials are correct');
        return false;
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// ===== MIDDLEWARE: Verify JWT =====
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, school, password } = req.body;
    console.log('📝 Register attempt:', email);
    
    try {
        // Validate input
        if (!name || !email || !school || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed');
        
        // Insert user - with all columns
        const [result] = await db.query(
            `INSERT INTO users (name, email, school, password_hash, profile_complete, is_admin, is_teacher) 
             VALUES (?, ?, ?, ?, 0, 0, 0)`,
            [name, email.toLowerCase(), school, hashedPassword]
        );
        
        console.log('✅ User registered:', email, 'ID:', result.insertId);
        res.json({ success: true, userId: result.insertId });
    } catch (error) {
        console.error('❌ Register error:', error.message);
        console.error('❌ Full error:', error);
        res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', email);
    
    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const [users] = await db.query(
            `SELECT id, email, name, school, password_hash, avatar_id, nickname, 
                    profile_complete, is_admin, is_teacher, class_code, teacher_email 
             FROM users WHERE email = ?`,
            [email.toLowerCase()]
        );
        
        if (users.length === 0) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = users[0];
        console.log('✅ User found');
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Remove password hash from response
        delete user.password_hash;
        
        console.log('✅ User logged in:', email);
        res.json({ 
            success: true, 
            token,
            user: {
                ...user,
                profileComplete: !!user.profile_complete,
                isAdmin: !!user.is_admin,
                isTeacher: !!user.is_teacher
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error.message);
        console.error('❌ Full error:', error);
        res.status(500).json({ error: 'Login failed: ' + error.message });
    }
});

// Get current user (with token)
app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, email, name, school, avatar_id, nickname, profile_complete, 
                    is_admin, is_teacher, class_code, teacher_email 
             FROM users WHERE id = ?`,
            [req.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = users[0];
        res.json({
            ...user,
            profileComplete: !!user.profile_complete,
            isAdmin: !!user.is_admin,
            isTeacher: !!user.is_teacher
        });
    } catch (error) {
        console.error('❌ Get user error:', error.message);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Update profile
app.put('/api/auth/profile', authenticate, async (req, res) => {
    const { name, school } = req.body;
    
    try {
        await db.query(
            'UPDATE users SET name = ?, school = ? WHERE id = ?',
            [name, school, req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Update profile error:', error.message);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update avatar & nickname
app.put('/api/auth/avatar', authenticate, async (req, res) => {
    const { avatarId, nickname } = req.body;
    
    try {
        await db.query(
            'UPDATE users SET avatar_id = ?, nickname = ?, profile_complete = 1 WHERE id = ?',
            [avatarId, nickname, req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Update avatar error:', error.message);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

// Change password
app.put('/api/auth/password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
        const [users] = await db.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, req.userId]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Change password error:', error.message);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ===== MAKE ADMIN =====

// Make user admin (with admin code)
app.post('/api/auth/make-admin', authenticate, async (req, res) => {
    const { code } = req.body;
    const ADMIN_CODE = 'CREOADMIN';
    
    if (code?.toUpperCase() !== ADMIN_CODE) {
        return res.status(403).json({ error: 'Incorrect admin code.' });
    }
    
    try {
        await db.query(
            'UPDATE users SET is_admin = 1 WHERE id = ?',
            [req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Make admin error:', error.message);
        res.status(500).json({ error: 'Failed to make admin' });
    }
});

// ===== PROGRESS ROUTES =====

// Get progress
app.get('/api/progress', authenticate, async (req, res) => {
    try {
        const [progress] = await db.query(
            'SELECT progress_data FROM progress WHERE user_id = ?',
            [req.userId]
        );
        
        if (progress.length === 0) {
            // Create default progress
            const defaultProgress = { completed: {}, highest: {}, history: {} };
            await db.query(
                'INSERT INTO progress (user_id, progress_data) VALUES (?, ?)',
                [req.userId, JSON.stringify(defaultProgress)]
            );
            return res.json(defaultProgress);
        }
        
        res.json(progress[0].progress_data);
    } catch (error) {
        console.error('❌ Get progress error:', error.message);
        res.status(500).json({ error: 'Failed to get progress' });
    }
});

// Save progress
app.post('/api/progress', authenticate, async (req, res) => {
    const progressData = req.body;
    
    try {
        await db.query(
            `INSERT INTO progress (user_id, progress_data, updated_at) 
             VALUES (?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE progress_data = ?, updated_at = NOW()`,
            [req.userId, JSON.stringify(progressData), JSON.stringify(progressData)]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Save progress error:', error.message);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// ===== MODULE ROUTES =====

// Get custom modules
app.get('/api/modules', async (req, res) => {
    try {
        const [customModules] = await db.query(
            'SELECT id, grade, `order`, title, subtitle, color, content, quiz FROM custom_modules ORDER BY grade, `order`'
        );
        
        res.json({ 
            custom: customModules.map(m => ({
                ...m,
                content: typeof m.content === 'string' ? JSON.parse(m.content) : m.content,
                quiz: typeof m.quiz === 'string' ? JSON.parse(m.quiz) : m.quiz
            }))
        });
    } catch (error) {
        console.error('❌ Get modules error:', error.message);
        res.status(500).json({ error: 'Failed to get modules' });
    }
});

// Admin: Add custom module
app.post('/api/admin/modules', authenticate, async (req, res) => {
    // Check if user is admin
    const [users] = await db.query('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || !users[0].is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { grade, title, subtitle, color, content, quiz } = req.body;
    
    try {
        // Get next order for this grade
        const [existing] = await db.query(
            'SELECT MAX(`order`) as max_order FROM custom_modules WHERE grade = ?',
            [grade]
        );
        const order = (existing[0].max_order || 0) + 1;
        
        const [result] = await db.query(
            `INSERT INTO custom_modules (grade, \`order\`, title, subtitle, color, content, quiz, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [grade, order, title, subtitle, color || '#7c3aed', JSON.stringify(content), JSON.stringify(quiz), req.userId]
        );
        
        res.json({ 
            success: true, 
            id: result.insertId,
            module: { id: result.insertId, grade, order, title, subtitle, color, content, quiz }
        });
    } catch (error) {
        console.error('❌ Add module error:', error.message);
        res.status(500).json({ error: 'Failed to add module' });
    }
});

// Admin: Delete custom module
app.delete('/api/admin/modules/:id', authenticate, async (req, res) => {
    // Check if user is admin
    const [users] = await db.query('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || !users[0].is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const moduleId = req.params.id;
    
    try {
        await db.query('DELETE FROM custom_modules WHERE id = ?', [moduleId]);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Delete module error:', error.message);
        res.status(500).json({ error: 'Failed to delete module' });
    }
});

// ===== SERIAL KEY ROUTES =====

// Get serial keys (admin only)
app.get('/api/admin/serial-keys', authenticate, async (req, res) => {
    const [users] = await db.query('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || !users[0].is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    try {
        const [keys] = await db.query(
            'SELECT id, code, used_by, used_at, created_at FROM serial_keys ORDER BY created_at DESC'
        );
        res.json(keys);
    } catch (error) {
        console.error('❌ Get serial keys error:', error.message);
        res.status(500).json({ error: 'Failed to get serial keys' });
    }
});

// Generate serial keys (admin only)
app.post('/api/admin/serial-keys', authenticate, async (req, res) => {
    const [users] = await db.query('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || !users[0].is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { count = 1 } = req.body;
    const generatedKeys = [];
    
    try {
        for (let i = 0; i < count; i++) {
            const code = 'CREO-' + 
                Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                Math.random().toString(36).substring(2, 6).toUpperCase();
            
            await db.query(
                'INSERT INTO serial_keys (code, created_by) VALUES (?, ?)',
                [code, req.userId]
            );
            generatedKeys.push(code);
        }
        
        res.json({ success: true, keys: generatedKeys });
    } catch (error) {
        console.error('❌ Generate keys error:', error.message);
        res.status(500).json({ error: 'Failed to generate keys' });
    }
});

// Redeem serial key
app.post('/api/serial/redeem', authenticate, async (req, res) => {
    const { code } = req.body;
    const normalizedCode = code.trim().toUpperCase();
    
    try {
        // Find key
        const [keys] = await db.query(
            'SELECT id, used_by FROM serial_keys WHERE code = ?',
            [normalizedCode]
        );
        
        if (keys.length === 0) {
            return res.status(400).json({ error: 'That serial key isn\'t valid.' });
        }
        
        const key = keys[0];
        if (key.used_by) {
            return res.status(400).json({ error: 'That serial key has already been used.' });
        }
        
        // Mark as used
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            await connection.query(
                'UPDATE serial_keys SET used_by = ?, used_at = NOW() WHERE id = ?',
                [req.userId, key.id]
            );
            
            await connection.query(
                `INSERT INTO access (user_id, serial_key, activated_at, expires_at) 
                 VALUES (?, ?, NOW(), ?)
                 ON DUPLICATE KEY UPDATE serial_key = ?, activated_at = NOW(), expires_at = ?`,
                [req.userId, normalizedCode, expiresAt, normalizedCode, expiresAt]
            );
            
            await connection.commit();
            res.json({ success: true });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('❌ Redeem key error:', error.message);
        res.status(500).json({ error: 'Failed to redeem serial key' });
    }
});

// Check access status
app.get('/api/access/status', authenticate, async (req, res) => {
    try {
        const [access] = await db.query(
            'SELECT serial_key, activated_at, expires_at FROM access WHERE user_id = ?',
            [req.userId]
        );
        
        if (access.length === 0) {
            return res.json({ hasAccess: false, expiresAt: null });
        }
        
        const now = new Date();
        const expiresAt = new Date(access[0].expires_at);
        const hasAccess = expiresAt > now;
        
        res.json({ 
            hasAccess, 
            expiresAt: expiresAt.toISOString(),
            daysRemaining: Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
        });
    } catch (error) {
        console.error('❌ Access status error:', error.message);
        res.status(500).json({ error: 'Failed to get access status' });
    }
});

// ===== TEACHER ROUTES =====

// Get teacher codes (admin only)
app.get('/api/admin/teacher-codes', authenticate, async (req, res) => {
    const [users] = await db.query('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || !users[0].is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    try {
        const [codes] = await db.query(
            'SELECT id, code, used_by, used_at, created_at FROM teacher_codes ORDER BY created_at DESC'
        );
        res.json(codes);
    } catch (error) {
        console.error('❌ Get teacher codes error:', error.message);
        res.status(500).json({ error: 'Failed to get teacher codes' });
    }
});

// Generate teacher codes (admin only)
app.post('/api/admin/teacher-codes', authenticate, async (req, res) => {
    const [users] = await db.query('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || !users[0].is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { count = 1 } = req.body;
    const generatedCodes = [];
    
    try {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        
        for (let i = 0; i < count; i++) {
            const group = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            const code = `TEACH-${group()}-${group()}`;
            
            await db.query(
                'INSERT INTO teacher_codes (code, created_by) VALUES (?, ?)',
                [code, req.userId]
            );
            generatedCodes.push(code);
        }
        
        res.json({ success: true, codes: generatedCodes });
    } catch (error) {
        console.error('❌ Generate teacher codes error:', error.message);
        res.status(500).json({ error: 'Failed to generate teacher codes' });
    }
});

// Redeem teacher code
app.post('/api/teacher/redeem', authenticate, async (req, res) => {
    const { code } = req.body;
    const normalizedCode = code.trim().toUpperCase();
    
    try {
        const [codes] = await db.query(
            'SELECT id, used_by FROM teacher_codes WHERE code = ?',
            [normalizedCode]
        );
        
        if (codes.length === 0) {
            return res.status(400).json({ error: 'That teacher code isn\'t valid.' });
        }
        
        const teacherCode = codes[0];
        if (teacherCode.used_by) {
            return res.status(400).json({ error: 'That teacher code has already been used.' });
        }
        
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            await connection.query(
                'UPDATE teacher_codes SET used_by = ?, used_at = NOW() WHERE id = ?',
                [req.userId, teacherCode.id]
            );
            
            await connection.query(
                'UPDATE users SET is_teacher = 1 WHERE id = ?',
                [req.userId]
            );
            
            // Generate a class code for the new teacher
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let classCode;
            let exists = true;
            
            // Make sure the code is unique
            while (exists) {
                classCode = 'CLS-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                const [existing] = await connection.query('SELECT id FROM users WHERE class_code = ?', [classCode]);
                exists = existing.length > 0;
            }
            
            await connection.query(
                'UPDATE users SET class_code = ? WHERE id = ?',
                [classCode, req.userId]
            );
            
            await connection.commit();
            res.json({ success: true, classCode });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('❌ Redeem teacher code error:', error.message);
        res.status(500).json({ error: 'Failed to redeem teacher code' });
    }
});

// Generate class code (teacher only)
app.post('/api/teacher/class-code', authenticate, async (req, res) => {
    const [users] = await db.query('SELECT is_teacher FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || !users[0].is_teacher) {
        return res.status(403).json({ error: 'Teacher access required' });
    }
    
    try {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code;
        let exists = true;
        
        // Make sure the code is unique
        while (exists) {
            code = 'CLS-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            const [existing] = await db.query('SELECT id FROM users WHERE class_code = ?', [code]);
            exists = existing.length > 0;
        }
        
        await db.query(
            'UPDATE users SET class_code = ? WHERE id = ?',
            [code, req.userId]
        );
        
        res.json({ success: true, classCode: code });
    } catch (error) {
        console.error('❌ Generate class code error:', error.message);
        res.status(500).json({ error: 'Failed to generate class code' });
    }
});

// Join class (student)
app.post('/api/teacher/join-class', authenticate, async (req, res) => {
    const { classCode } = req.body;
    const normalizedCode = classCode.trim().toUpperCase();
    
    try {
        // Find teacher with this class code
        const [teachers] = await db.query(
            'SELECT id, email FROM users WHERE class_code = ? AND is_teacher = 1',
            [normalizedCode]
        );
        
        if (teachers.length === 0) {
            return res.status(400).json({ error: 'That class code isn\'t valid.' });
        }
        
        // Check if user is trying to join their own class
        if (teachers[0].id === req.userId) {
            return res.status(400).json({ error: 'You can\'t join your own class.' });
        }
        
        // Update student's teacher
        await db.query(
            'UPDATE users SET teacher_email = ? WHERE id = ?',
            [teachers[0].email, req.userId]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Join class error:', error.message);
        res.status(500).json({ error: 'Failed to join class' });
    }
});

// Leave class (student)
app.post('/api/teacher/leave-class', authenticate, async (req, res) => {
    try {
        await db.query(
            'UPDATE users SET teacher_email = NULL WHERE id = ?',
            [req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Leave class error:', error.message);
        res.status(500).json({ error: 'Failed to leave class' });
    }
});

// Get all students for teacher/leaderboard
app.get('/api/teacher/students', authenticate, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT is_admin, is_teacher, teacher_email FROM users WHERE id = ?',
            [req.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const currentUser = users[0];
        let query = '';
        let params = [];
        
        if (currentUser.is_admin) {
            // Admin sees all students (non-admin, non-teacher users)
            query = `
                SELECT id, name, email, school, nickname, avatar_id, is_admin, is_teacher, 
                       class_code, teacher_email, profile_complete
                FROM users 
                WHERE is_admin = 0 AND is_teacher = 0
                ORDER BY name
            `;
        } else if (currentUser.is_teacher) {
            // Teacher sees only their students
            query = `
                SELECT id, name, email, school, nickname, avatar_id, is_admin, is_teacher, 
                       class_code, teacher_email, profile_complete
                FROM users 
                WHERE teacher_email = (SELECT email FROM users WHERE id = ?)
                ORDER BY name
            `;
            params = [req.userId];
        } else {
            // Regular student sees classmates (students with same teacher)
            if (currentUser.teacher_email) {
                query = `
                    SELECT id, name, email, school, nickname, avatar_id, is_admin, is_teacher, 
                           class_code, teacher_email, profile_complete
                    FROM users 
                    WHERE teacher_email = ? AND id != ?
                    ORDER BY name
                `;
                params = [currentUser.teacher_email, req.userId];
            } else {
                // Student not in a class
                return res.json([]);
            }
        }
        
        const [students] = await db.query(query, params);
        
        // Get progress and access for each student
        const studentsWithProgress = await Promise.all(students.map(async (student) => {
            const [progress] = await db.query(
                'SELECT progress_data FROM progress WHERE user_id = ?',
                [student.id]
            );
            
            const progressData = progress.length > 0 ? progress[0].progress_data : { completed: {}, highest: {}, history: {} };
            
            // Get access status
            const [access] = await db.query(
                'SELECT expires_at FROM access WHERE user_id = ?',
                [student.id]
            );
            
            const hasAccess = access.length > 0 && new Date(access[0].expires_at) > new Date();
            
            // Calculate completed modules count
            const [allModules] = await db.query('SELECT COUNT(*) as total FROM custom_modules');
            const totalModules = allModules[0]?.total || 0;
            
            // Count completed modules from progress data
            const completedCount = Object.keys(progressData.completed || {}).filter(key => progressData.completed[key]).length;
            
            // Calculate average score
            const scores = Object.values(progressData.highest || {});
            const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            
            return {
                ...student,
                progress: progressData,
                hasAccess,
                expiresAt: access.length > 0 ? access[0].expires_at : null,
                completedCount,
                totalModules: totalModules || 5, // Default to built-in modules count
                avgScore
            };
        }));
        
        res.json(studentsWithProgress);
    } catch (error) {
        console.error('❌ Get students error:', error.message);
        res.status(500).json({ error: 'Failed to get students' });
    }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    await testDB();
    console.log(`✅ Open http://localhost:${PORT} in your browser`);
    console.log('📝 Test accounts:');
    console.log('   Admin: admin@creobotics.com / admin123');
    console.log('   Or register a new account');
});