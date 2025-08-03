const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Immortal Nexus Backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
        }
    };

    res.status(200).json(healthCheck);
});

// Detailed health check with database connection
router.get('/health/detailed', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        
        const healthCheck = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'Immortal Nexus Backend',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
            },
            database: {
                status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                name: mongoose.connection.name || 'unknown'
            }
        };

        res.status(200).json(healthCheck);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router; 