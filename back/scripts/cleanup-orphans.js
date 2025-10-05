// Script to cleanup orphaned and corrupted profile comments
const mongoose = require('mongoose');
require('dotenv').config();

const Comment = require('../models/Comment');
const User = require('../models/User');

async function cleanupComments() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MongoDB URI not found in environment variables');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Find all profile comments
        const profileComments = await Comment.find({ targetType: 'profile' });
        console.log(`Total profile comments: ${profileComments.length}\n`);

        const toDelete = [];
        const reasons = {};

        for (const comment of profileComments) {
            const targetId = comment.targetId;

            // Check for corrupted targetIds (contains encoding artifacts, objects, etc)
            const isCorrupted = targetId.includes('object') ||
                              targetId.includes('[') ||
                              targetId.includes('<') ||
                              targetId.includes('%20') || // URL encoded space that wasn't decoded
                              targetId.length > 50;

            if (isCorrupted) {
                toDelete.push(comment._id);
                reasons[comment._id] = `Corrupted targetId: "${targetId}"`;
                continue;
            }

            // Check if user exists
            const userExists = await User.findOne({ username: targetId });
            if (!userExists) {
                toDelete.push(comment._id);
                reasons[comment._id] = `Orphaned - user "${targetId}" doesn't exist`;
            }
        }

        console.log(`Found ${toDelete.length} comments to delete:\n`);

        for (const id of toDelete) {
            console.log(`  - ${id}: ${reasons[id]}`);
        }

        if (toDelete.length > 0) {
            console.log('\nDeleting...');
            const result = await Comment.deleteMany({ _id: { $in: toDelete } });
            console.log(`\n✓ Deleted ${result.deletedCount} comments`);
        } else {
            console.log('\n✓ No orphaned or corrupted comments found!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

cleanupComments();
