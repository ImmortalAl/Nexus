#!/usr/bin/env node

// Cleanup script for orphaned profile comments
// Run this with: node cleanup-orphaned-comments.js

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('=== Orphaned Comments Cleanup Tool ===\n');
console.log('This tool will delete profile comments for users that no longer exist.\n');

rl.question('Enter your session token (from localStorage): ', async (token) => {
    if (!token || token.trim() === '') {
        console.log('Error: Token is required');
        rl.close();
        process.exit(1);
    }

    try {
        const fetch = (await import('node-fetch')).default;

        console.log('\nConnecting to API...');
        const response = await fetch('https://nexus-ytrg.onrender.com/api/comments/cleanup/orphaned', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token.trim()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`\nError: ${response.status} - ${errorText}`);
            rl.close();
            process.exit(1);
        }

        const result = await response.json();

        console.log('\n=== Cleanup Results ===');
        console.log(`Message: ${result.message}`);
        console.log(`Deleted Count: ${result.deletedCount}`);

        if (result.orphanedUsers && result.orphanedUsers.length > 0) {
            console.log('\nOrphaned users found:');
            result.orphanedUsers.forEach(username => {
                console.log(`  - ${username}`);
            });
        }

        console.log('\n✓ Cleanup completed successfully!');

    } catch (error) {
        console.error('\nError during cleanup:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
});
