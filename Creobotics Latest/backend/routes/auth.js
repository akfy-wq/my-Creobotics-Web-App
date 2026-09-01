const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ============================================================
// TEST ROUTE - For debugging
// ============================================================
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes working' });
});

// ============================================================
// REGISTER - Create new user account
// ============================================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, school, role } = req.body;
        
        // Validate
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        
        // Check if user exists
        const [existing] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user
        const [result] = await pool.execute(
            'INSERT INTO users (email, password_hash, name, school, role) VALUES (?, ?, ?, ?, ?)',
            [email, passwordHash, name, school || '', role || 'student']
        );
        
        // Generate token
        const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: {
                id: result.insertId,
                name,
                email,
                school: school || '',
                role: role || 'student',
                profileComplete: false
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// ============================================================
// LOGIN - Authenticate user
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        
        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        
        // Verify role match
        if (role && user.role !== role) {
            const roleLabels = { student: 'Student', teacher: 'Teacher', admin: 'Admin' };
            return res.status(403).json({ 
                error: `This account is registered as ${roleLabels[user.role] || user.role}. Please select the correct role.`
            });
        }
        
        // Generate token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                school: user.school,
                role: user.role,
                avatarId: user.avatar_id,
                nickname: user.nickname,
                profileComplete: !!user.profile_complete
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// ============================================================
// GET PROFILE - Get current user's profile (protected)
// ============================================================
router.get('/profile', async (req, res) => {
    try {
        // Get user from token
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await pool.execute(
            'SELECT id, email, name, school, role, avatar_id, nickname, profile_complete, created_at FROM users WHERE id = ?',
            [decoded.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        const user = users[0];
        res.json({
            user: {
                ...user,
                profileComplete: !!user.profile_complete
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// UPDATE PROFILE - Update user profile (protected)
// ============================================================
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { name, school, avatarId, nickname } = req.body;
        
        const updates = [];
        const values = [];
        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (school !== undefined) { updates.push('school = ?'); values.push(school); }
        if (avatarId !== undefined) { updates.push('avatar_id = ?'); values.push(avatarId); }
        if (nickname !== undefined) { updates.push('nickname = ?'); values.push(nickname); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }
        
        values.push(decoded.id);
        await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        
        const [users] = await pool.execute(
            'SELECT id, email, name, school, role, avatar_id, nickname, profile_complete FROM users WHERE id = ?',
            [decoded.id]
        );
        
        res.json({ message: 'Profile updated successfully.', user: users[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// COMPLETE PROFILE SETUP - Set avatar and nickname (protected)
// ============================================================
router.put('/profile/setup', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { avatarId, nickname } = req.body;
        
        if (!avatarId || !nickname || nickname.length < 2) {
            return res.status(400).json({ error: 'Avatar and nickname are required.' });
        }
        
        await pool.execute(
            'UPDATE users SET avatar_id = ?, nickname = ?, profile_complete = TRUE WHERE id = ?',
            [avatarId, nickname, decoded.id]
        );
        
        const [users] = await pool.execute(
            'SELECT id, email, name, school, role, avatar_id, nickname, profile_complete FROM users WHERE id = ?',
            [decoded.id]
        );
        
        res.json({ message: 'Profile setup complete.', user: users[0] });
    } catch (error) {
        console.error('Profile setup error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// CHANGE PASSWORD - Update password (protected)
// ============================================================
router.put('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }
        
        const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }
        
        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, decoded.id]);
        
        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// RESET PASSWORD - Forgot password (public)
// ============================================================
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        if (!email || !newPassword) {
            return res.status(400).json({ error: 'Email and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'No account found with that email.' });
        }
        
        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, email]);
        
        res.json({ message: 'Password reset successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================================
// LOGOUT - Log out user (public)
// ============================================================
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully.' });
});

module.exports = router;