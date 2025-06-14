const express = require('express');
const app = express();

// Environment configuration
const environments = {
  dev: { port: 3055, message: 'Hello from DEV K6 test!' },
  staging: { port: 3056, message: 'Hello from STAGING K6 test!' },
  prod: { port: 3057, message: 'Hello from PROD K6 test!' }
};

const env = process.env.NODE_ENV || 'dev';
const config = environments[env];

// Middleware to parse JSON
app.use(express.json());

// Simple GET endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: config.message });
});

// POST endpoint with data validation
app.post('/api/users', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  res.status(201).json({ id: 1, name, environment: env });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server (${env}) running on http://localhost:${config.port}`);
});