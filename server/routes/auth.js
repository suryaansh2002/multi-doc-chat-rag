const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const nodemailer = require('nodemailer');

// Email transporter
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

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
};

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

        // Create user
        user = new User({
            email,
            password,
            otp: {
                code: otp,
                expiresAt: otpExpiry
            }
        });

        await user.save();
        await sendOTPEmail(email, otp);

        res.status(201).json({ message: 'User created, please verify OTP', email });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Error in signup' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
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

        // Mark user as verified
        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Error in OTP verification' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({ error: 'Please verify your email first' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error in login' });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

        user.otp = {
            code: otp,
            expiresAt: otpExpiry
        };
        await user.save();
        await sendOTPEmail(email, otp);

        res.json({ message: 'New OTP sent' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Error resending OTP' });
    }
});

module.exports = router;