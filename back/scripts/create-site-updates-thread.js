const mongoose = require('mongoose');
const Thread = require('../models/Thread');
const User = require('../models/User');

async function createSiteUpdatesThread() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mlnf';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Find system user or any admin
        let systemUser = await User.findOne({ role: 'admin' });
        if (!systemUser) {
            console.error('No admin user found. Please create an admin user first.');
            process.exit(1);
        }
        console.log(`Using user: ${systemUser.username}`);

        // Check if Site Updates thread already exists
        const existing = await Thread.findOne({ 
            category: 'Site Updates',
            title: { $regex: /Welcome to Site Updates/ }
        });

        if (existing) {
            console.log('Site Updates welcome thread already exists');
            process.exit(0);
        }

        // Create Site Updates welcome thread
        const thread = new Thread({
            title: 'Welcome to Site Updates',
            content: '<p>🔔 <strong>Welcome to the Site Updates section!</strong></p><p>This is your official source for all Immortal Nexus announcements, feature releases, bug fixes, and platform improvements.</p><p>✨ <strong>What you\'ll find here:</strong></p><ul><li>New feature announcements</li><li>Site improvements and enhancements</li><li>Bug fixes and technical updates</li><li>Community milestones</li><li>System maintenance notices</li></ul><p>Stay tuned for regular updates as we continue to evolve and improve your eternal experience.</p>',
            category: 'Site Updates',
            tags: ['welcome', 'announcements', 'official'],
            author: systemUser._id,
            createdAt: new Date(),
            updatedAt: new Date(),
            replies: [],
            isLocked: false
        });

        await thread.save();
        console.log('✅ Created Site Updates welcome thread');

        // Verify
        const count = await Thread.countDocuments({ category: 'Site Updates' });
        console.log(`📊 Site Updates: ${count} thread(s)`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating Site Updates thread:', error);
        process.exit(1);
    }
}

// Only run if called directly
if (require.main === module) {
    createSiteUpdatesThread();
}

module.exports = createSiteUpdatesThread;
