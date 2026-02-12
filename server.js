// server.js
// Production entry point – configures Express, serves frontend, mounts routes
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./src/middlewares/errorHandler');
const uploadController = require('./src/controllers/uploadController');

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// Global Middleware
// ======================
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend (production build / Vanilla assets)
app.use(express.static(path.join(__dirname, 'public')));

// ======================
// API Routes
// ======================
app.post('/upload', uploadController.handleUpload);

// Health check
app.get('/health', (req, res) => res.status(200).send('OK'));

// ======================
// Global Error Handler
// ======================
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;