const express = require('express');
const router = express.Router();
const User = require('../models/user');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send reset OTP email
const sendResetOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is: ${otp}. This code will expire in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
};

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate and save OTP
        const otp = generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

        user.otp = {
            code: otp,
            expiresAt: otpExpiry
        };
        await user.save();

        // Send OTP email
        await sendResetOTPEmail(email, otp);

        res.json({ message: 'Reset code sent to email' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Error initiating password reset' });
    }
});

// Verify OTP for password reset
router.post('/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.otp || !user.otp.code || user.otp.expiresAt < new Date()) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        if (user.otp.code !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        res.json({ message: 'OTP verified' });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Error verifying OTP' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify OTP again for security
        if (!user.otp || !user.otp.code || user.otp.expiresAt < new Date() || user.otp.code !== otp) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Update password
        user.password = newPassword;
        user.otp = undefined; // Clear OTP after use
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Error resetting password' });
    }
});

module.exports = router;