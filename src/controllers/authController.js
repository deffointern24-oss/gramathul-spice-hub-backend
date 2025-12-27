// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { google } = require('googleapis');
const { sendOTPGmail, sendPasswordChangedGmail } = require('../utils/emailService')

// ✅ Initialize Google OAuth2 client
const client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

// Regular signup
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, name, email, password, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'gmail and password are required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'gmail already in use. Please login or use a different gmail.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user name
    const userName = name || (firstName && lastName ? `${firstName} ${lastName}` : email.split('@')[0]);

    // Create new user
    const newUser = new User({
      name: userName,
      email,
      password: hashedPassword,
      role: role || 'USER',
      phone: '',
      address: ''
    });
    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, gmail: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        gmail: newUser.email,
        role: newUser.role,
        phone: newUser.phone || '',
        address: newUser.address || ''
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: err.message
    });
  }
};

// Google OAuth signup/login (handles all Google scenarios)
exports.googleSignup = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code required'
      });
    }

    // Exchange code for tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri: 'postmessage'
    });
    client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();

    // Validate Google response
    if (!data.email) {
      return res.status(400).json({
        success: false,
        message: 'Unable to get email from Google'
      });
    }

    // Find existing user by email
    let user = await User.findOne({ email: data.email });

    if (!user) {
      // ✅ Scenario 1: First-time Google signup - CREATE new user
      user = new User({
        name: data.name || data.email.split('@')[0],
        email: data.email,
        password: '', // Empty for Google-only users
        phone: '',
        address: '',
        role: 'USER'
      });
      await user.save();
      console.log('✅ New Google user created:', user.email);
    } else {
      // ✅ Scenario 2: Re-login with Google - User already exists
      // ✅ Scenario 3: User signed up with email/password, now using Google - Same account
      console.log('✅ Existing user logging in with Google:', user.email);

      // Optional: Update name if it's different from Google
      if (data.name && user.name !== data.name) {
        user.name = data.name;
        await user.save();
      }
    }

    // Generate JWT token (new session)
    const token = jwt.sign(
      {
        id: user._id,
        gmail: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        gmail: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || ''
      }
    });

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: err.message
    });
  }
};

// Regular login
exports.login = async (req, res) => {
  try {
    const { gmail, password } = req.body;
    // Validate required fields
    if (!gmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'gmail and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: gmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid gmail or password' // Don't reveal if gmail exists
      });
    }

    // ✅ Check if user signed up with Google only (no password set)
    if (!user.password || user.password === '') {
      return res.status(401).json({
        success: false,
        message: 'This account was created with Google. Please sign in with Google.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid gmail or password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, gmail: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        gmail: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || ''
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: err.message
    });
  }
};


// ✅ Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  const { gmail } = req.body;

  if (!gmail) {
    return res.status(400).json({
      success: false,
      message: 'gmail is required',
    });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email: gmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this gmail',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiry (10 minutes)
    user.resetOTP = otp;
    user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // ✅ Send OTP via Brevo
    await sendOTPGmail(user.email, user.name, otp);

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your gmail. Please check your inbox.',
    });

  } catch (err) {
    console.error('❌ Forgot Password Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP gmail',
      error: err.message,
    });
  }
};

// ✅ Reset Password - Verify OTP and Update Password
exports.resetPassword = async (req, res) => {
  const { gmail, otp, newPassword } = req.body;

  if (!gmail || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'gmail, OTP, and new password are required',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  try {
    // Find user
    const user = await User.findOne({ email: gmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if OTP exists
    if (!user.resetOTP || !user.resetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found. Please request a new OTP.',
      });
    }

    // Check if OTP expired
    if (new Date() > user.resetOTPExpiry) {
      user.resetOTP = undefined;
      user.resetOTPExpiry = undefined;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Verify OTP
    if (user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    // ✅ Send confirmation gmail
    await sendPasswordChangedGmail(user.email, user.name);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.',
    });

  } catch (err) {
    console.error('❌ Reset Password Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: err.message,
    });
  }
};
