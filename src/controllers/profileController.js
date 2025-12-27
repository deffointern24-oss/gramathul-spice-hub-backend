const User = require('../models/User');
const bcrypt = require('bcrypt');

//  Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password') 
      .lean(); 

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

//  Edit user profile
exports.editProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name && !email && !phone && !address) {
      return res.status(400).json({ 
        error: 'At least one field is required to update' 
      });
    }
    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (phone) updates.phone = phone.trim();
    if (address) updates.address = address.trim();
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.trim().toLowerCase(),
        _id: { $ne: req.user.id }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email already in use by another account' 
        });
      }
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { 
        new: true,
        runValidators: true, 
        context: 'query' 
      }
    )
    .select('-password') 
    .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true,
      message: 'Profile updated successfully',
      user 
    });
  } catch (err) {
    console.error('editProfile error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: 'Email already in use' 
      });
    }

    res.status(500).json({ error: 'Failed to update profile' });
  }
};


//  Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        error: 'Password is required to delete account' 
      });
    }
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Incorrect password' 
      });
    }
    await User.findByIdAndDelete(req.user.id);

    res.json({ 
      success: true,
      message: 'Account deleted successfully' 
    });
  } catch (err) {
    console.error('deleteAccount error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};