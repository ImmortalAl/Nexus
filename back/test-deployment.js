// Simple test server to verify Render deployment
const express = require('express');
const app = express();

// Enable CORS for all origins
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Nexus backend is running!',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

app.get('/ping', (req, res) => {
    res.send('pong');
});

app.get('/api/test', (req, res) => {
    res.json({ status: 'API routes working' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});