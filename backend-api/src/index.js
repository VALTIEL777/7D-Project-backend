// index.js
const express = require('express');
const db = require('./config/db');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// New endpoint to test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({ status: 'Database connected', currentTime: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error', err);
    res.status(500).json({ status: 'Database connection failed', error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
