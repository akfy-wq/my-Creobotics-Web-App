const User = require('../models/User');
const Progress = require('../models/Progress');
const Streak = require('../models/Streak');
const SerialKey = require('../models/SerialKey');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

exports.register = async (req, res) => {
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
        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        // Create user
        const user = await User.create({ name, email, password, school, role: role || 'student' });
        
        // Initialize streak
        await Streak.recordDailyAccess(user.id);

        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                school: user.school,
                role: user.role,
                profileComplete: false
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Verify password
        const isValid = await User.verifyPassword(email, password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Verify role match (if specified)
        if (role && user.role !== role) {
            const roleLabels = { student: 'Student', teacher: 'Teacher', admin: 'Admin' };
            return res.status(403).json({ 
                error: `This account is registered as ${roleLabels[user.role] || user.role}. Please select the correct role.`
            });
        }

        // Update streak
        await Streak.recordDailyAccess(user.id);

        // Get progress summary
        const progress = await Progress.getAll(user.id);

        // Generate token
        const token = generateToken(user.id);

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
            },
            progress
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const progress = await Progress.getAll(req.userId);
        const streak = await Streak.get(req.userId);

        res.json({
            user: {
                ...user,
                profileComplete: !!user.profile_complete
            },
            progress,
            streak: streak || { current_streak: 0, longest_streak: 0, last_active_date: null, dates: [] }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, school, avatarId, nickname } = req.body;

        await User.update(req.userId, { name, school, avatar_id: avatarId, nickname });

        const user = await User.findById(req.userId);
        res.json({ message: 'Profile updated successfully.', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.completeProfileSetup = async (req, res) => {
    try {
        const { avatarId, nickname } = req.body;

        if (!avatarId || !nickname || nickname.length < 2) {
            return res.status(400).json({ error: 'Avatar and nickname are required.' });
        }

        await User.update(req.userId, { 
            avatar_id: avatarId, 
            nickname, 
            profile_complete: true 
        });

        const user = await User.findById(req.userId);
        res.json({ message: 'Profile setup complete.', user });
    } catch (error) {
        console.error('Profile setup error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }

        const user = await User.findByEmail(req.user.email);
        const isValid = await User.verifyPassword(user.email, currentPassword);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        await User.updatePassword(req.userId, newPassword);
        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ error: 'Email and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'No account found with that email.' });
        }

        await User.updatePassword(user.id, newPassword);
        res.json({ message: 'Password reset successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

exports.logout = async (req, res) => {
    // JWT is stateless, client should discard token
    res.json({ message: 'Logged out successfully.' });
};