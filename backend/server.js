const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const businessTypeRoutes = require('./routes/businessTypes');
const magazineRoutes = require('./routes/magazines');
const contentSizeRoutes = require('./routes/contentSizes');
const bookingRoutes = require('./routes/bookings');
const leafletDeliveryRoutes = require('./routes/leafletDelivery');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/business-types', businessTypeRoutes);
app.use('/api/magazines', magazineRoutes);
app.use('/api/content-sizes', contentSizeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/leaflet-delivery', leafletDeliveryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingsapp';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

module.exports = app; 