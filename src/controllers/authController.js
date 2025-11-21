const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, gmail, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ firstName, lastName, gmail, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User created!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { gmail, password } = req.body;
    const user = await User.findOne({ gmail });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Include role in JWT payload
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
