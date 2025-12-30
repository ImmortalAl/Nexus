const mongoose = require('mongoose');
const Thread = require('../models/Thread');
const User = require('../models/User');

async function createNexusCentralThread() {
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

        // Check if Nexus Central thread already exists
        const existing = await Thread.findOne({ 
            category: 'Nexus Central',
            title: { $regex: /Welcome to Nexus Central/ }
        });

        if (existing) {
            console.log('Nexus Central welcome thread already exists');
            process.exit(0);
        }

        // Create Nexus Central welcome thread
        const thread = new Thread({
            title: 'Welcome to Nexus Central',
            content: '<p>🏛️ <strong>Welcome to Nexus Central</strong> - The heart of our platform.</p><p>This is <em>your</em> space for everything about Immortal Nexus itself. Whether you\'re here to stay informed, share ideas, report issues, or help shape the future of this community, you\'re in the right place.</p><p>✨ <strong>What belongs here:</strong></p><ul><li><strong>Official Announcements</strong> - New features, improvements, and platform updates</li><li><strong>Feature Requests</strong> - Share your ideas for making Nexus better</li><li><strong>Bug Reports</strong> - Help us identify and fix issues</li><li><strong>Site Questions</strong> - How does this work? Where do I find X?</li><li><strong>Community Feedback</strong> - Your thoughts on the platform experience</li><li><strong>Technical Discussions</strong> - Under-the-hood conversations about how Nexus works</li></ul><p>💬 <strong>This is a collaborative space.</strong> Admins will post official updates, but this category belongs to everyone. Your voice matters in shaping this platform.</p><p>Let\'s build something eternal together.</p>',
            category: 'Nexus Central',
            tags: ['welcome', 'meta', 'official'],
            author: systemUser._id,
            createdAt: new Date(),
            updatedAt: new Date(),
            replies: [],
            isLocked: false
        });

        await thread.save();
        console.log('✅ Created Nexus Central welcome thread');

        // Verify
        const count = await Thread.countDocuments({ category: 'Nexus Central' });
        console.log(`📊 Nexus Central: ${count} thread(s)`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating Nexus Central thread:', error);
        process.exit(1);
    }
}

// Only run if called directly
if (require.main === module) {
    createNexusCentralThread();
}

module.exports = createNexusCentralThread;
