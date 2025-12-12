const express = require('express');
const cron = require('node-cron');
const axios = require('axios');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const cors = require('cors');
const wishlistRoutes = require('./routes/wishlistRoutes');
const profileRoutes = require('./routes/profileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');


const authRoutes = require('./routes/authRoutes');


dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log("Frontend URL:", process.env.FRONTEND_URL);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173',process.env.FRONTEND_URL],
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
app.use('/api/payment', paymentRoutes);


app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const baseurl =()=>{
  if(process.env.NODE_ENV==='production'){
    return process.env.RENDER_URL;
  }
  return 'http://localhost:5000';
}

// Self-ping every minute to prevent idling

cron.schedule('*/5 * * * *', async () => {
  try {
    await axios.get(`${baseurl()}/api/health`);
    console.log('[KeepAlive] Self-ping success');
  } catch (e) {
    console.error('[KeepAlive] Ping failed', e.message);
  }
});

app.get('/api/getkey', (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
