const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const cors = require('cors');
const wishlistRoutes = require('./routes/wishlistRoutes');
const profileRoutes = require('./routes/profileRoutes');



const authRoutes = require('./routes/authRoutes');
const { authenticate, authorize } = require('./middleware/auth');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173'],
  credentials: true
}));


// Connect to MongoDB
connectDB();
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/profile', profileRoutes);

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
