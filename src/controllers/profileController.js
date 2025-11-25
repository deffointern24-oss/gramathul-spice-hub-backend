const User = require('../models/User');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit user profile
exports.editProfile = async (req, res) => {
  try {
    const { firstName, lastName, gmail } = req.body;
    const updates = {};
    
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (gmail) updates.gmail = gmail;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });
    
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
