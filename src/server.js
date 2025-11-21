const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const authRoutes = require('./routes/authRoutes');
const { authenticate, authorize } = require('./middleware/auth');

dotenv.config();
const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Example of a protected admin route
app.get('/api/admin/dashboard', authenticate, authorize(['ADMIN']), (req, res) => {
  res.send('Admin dashboard!');
});

// Example of a protected user route
app.get('/api/user/dashboard', authenticate, authorize(['USER', 'ADMIN']), (req, res) => {
  res.send('User dashboard!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
