const express = require('express');
const routes = express.Router();
const User = require('../models/user');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Helper function to send emails
const sendEmail = async (email, subject, text) => {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        let info = await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: subject,
            text: text
        });

        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Could not send email');
    }
};

// Register API
routes.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password and save the user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        const savedUser = await newUser.save();
        
        res.status(201).json(savedUser);
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login API
routes.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        res.json({ message: 'Logged in successfully' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Forgot Password API
routes.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate reset token and save
        const token = await user.generateResetToken();

        // Send reset password email
        const resetUrl = `https://authentication-app-guvi.netlify.app/reset-password?token=${token}`;
        const message = `Hi there,\nWe received a request to reset your password. Please click the link below to reset it: ${resetUrl}\nIf you did not request a password reset, please ignore this email.\nBest,\nYour Team`;

        await sendEmail(email, 'Reset Password', message);

        res.json({ message: 'Email sent with reset password instructions' });
    } catch (error) {
        console.error('Error during forgot-password:', error);
        res.status(500).json({ message: 'Server error during forgot-password' });
    }
});

// Reset Password API
routes.patch('/reset-password/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordTokenExpires: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        // Hash the new password and save it
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordTokenExpires = null;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error during reset-password:', error);
        res.status(500).json({ message: 'Server error during reset-password' });
    }
});

// Get Users API
routes.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
});

module.exports = routes;
