// index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const chronicleRoutes = require('./routes/chronicles');
const threadsRoutes = require('./routes/threads');
const moderationRoutes = require('./routes/moderation');
const blogRoutes = require('./routes/blogs');
const profileRoutes = require('./routes/profileRoutes');
const messagesRoutes = require('./routes/messages');
const owlRoutes = require('./routes/owls');
const commentsRoutes = require('./routes/comments');
const governanceRoutes = require('./routes/governance');
const highlightsRoutes = require('./routes/highlights');
const communityModRoutes = require('./routes/communityMod');
const anonymousRoutes = require('./routes/anonymous');
const activityRoutes = require('./routes/activity');
const analyticsRoutes = require('./routes/analytics');
const mindmapRoutes = require('./routes/mindmap');
const debugRoutes = require('./routes/debug');
const errorsRoutes = require('./routes/errors');
const pollRoutes = require('./routes/polls');
const notificationRoutes = require('./routes/notifications');
const linksRoutes = require('./routes/links');
const cors = require('cors');
const http = require('http');
const WebSocketManager = require('./websocket');
const CredibilityService = require('./services/credibilityService');
const NotificationService = require('./services/notificationService');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://immortal:cN0VuntETXgV7xD1@mlnf-cluster.ctoehaf.mongodb.net/mlnf?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
  });

const app = express();

// Trust proxy - Required for Render/Cloudflare to correctly identify client IPs
// This fixes rate limiting and logging when behind a reverse proxy
app.set('trust proxy', true);

// Logging middleware (place early to see all requests)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.ip} (Origin: ${req.headers.origin})`);
    next();
});

// Middleware - Increase body size limit to support images in blog posts
// Quill editor embeds images as base64, which can be large
// Generous limit to support multiple high-quality images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'https://immortal.nexus',  // Primary custom domain
            'http://immortal.nexus',
            'https://immortalnexus.netlify.app',
            'http://immortalnexus.netlify.app',  // Added HTTP version
            'https://dashing-belekoy-7a0095.netlify.app',  // Actual live site
            'http://dashing-belekoy-7a0095.netlify.app',
            'https://nexus-ytrg.onrender.com',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            // Allow requests from allowed origins or same-origin (no origin header)
            callback(null, true);
        } else {
            console.log(`[CORS] Blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
    exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Handle OPTIONS requests for all routes (CORS preflight)
app.options('*', cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/chronicles', chronicleRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/threads', threadsRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/highlights', highlightsRoutes);
app.use('/api/community-mod', communityModRoutes);
app.use('/api/anonymous', anonymousRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mindmap', mindmapRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/errors', errorsRoutes);
app.use('/api/poll', pollRoutes);
app.use('/api/links', linksRoutes);
app.use('/api', owlRoutes);

// --- Test & Health Routes ---
app.get('/ping', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send('pong');
});
// OPTIONS handler for health endpoint preflight
app.options('/health', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires');
    res.status(200).end();
});

app.get('/health', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires');
    res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`Error from ${req.ip} on ${req.method} ${req.originalUrl}:`, err.message, err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket Manager
const wsManager = new WebSocketManager(server);

// Make WebSocket manager available to routes
app.set('wsManager', wsManager);

// Set WebSocket manager for NotificationService
NotificationService.setWebSocketManager(wsManager);

// Make CredibilityService available to routes
app.locals.CredibilityService = CredibilityService;

// Start the server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`Server running on ${HOST}:${PORT}`));
