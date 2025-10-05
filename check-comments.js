#!/usr/bin/env node

// Check for corrupted/orphaned comments
const path = require('path');
// Load dotenv from back directory
try {
    require('dotenv').config({ path: path.join(__dirname, 'back', '.env') });
} catch (e) {
    // dotenv not required if env vars already set
}
const mongoose = require('mongoose');

const Comment = require('./back/models/Comment');
const User = require('./back/models/User');

async function checkComments() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Find all profile comments
        const profileComments = await Comment.find({ targetType: 'profile' });
        console.log(`Total profile comments: ${profileComments.length}\n`);

        let orphanedCount = 0;
        let corruptedCount = 0;
        const orphanedComments = [];
        const corruptedComments = [];

        for (const comment of profileComments) {
            const targetId = comment.targetId;

            // Check for corrupted targetIds
            const isCorrupted = targetId.includes('object') ||
                              targetId.includes('[') ||
                              targetId.includes('<') ||
                              targetId.includes('%') ||
                              targetId.length > 50;

            if (isCorrupted) {
                corruptedCount++;
                corruptedComments.push({
                    id: comment._id,
                    targetId: targetId,
                    content: comment.content.substring(0, 50) + '...'
                });
                continue;
            }

            // Check if user exists
            const userExists = await User.findOne({ username: targetId });
            if (!userExists) {
                orphanedCount++;
                orphanedComments.push({
                    id: comment._id,
                    targetId: targetId,
                    content: comment.content.substring(0, 50) + '...'
                });
            }
        }

        console.log('=== Results ===\n');
        console.log(`Corrupted comments: ${corruptedCount}`);
        if (corruptedComments.length > 0) {
            corruptedComments.forEach(c => {
                console.log(`  - ID: ${c.id}, TargetId: "${c.targetId}", Content: "${c.content}"`);
            });
        }

        console.log(`\nOrphaned comments: ${orphanedCount}`);
        if (orphanedComments.length > 0) {
            orphanedComments.forEach(c => {
                console.log(`  - ID: ${c.id}, User: "${c.targetId}", Content: "${c.content}"`);
            });
        }

        console.log('\nTo delete these comments, run:');
        if (corruptedCount > 0) {
            console.log('  node delete-comments.js corrupted');
        }
        if (orphanedCount > 0) {
            console.log('  node delete-comments.js orphaned');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkComments();
