/**
 * Notification Cleanup Job
 * Runs periodically to delete old read notifications (90 days)
 * Should be triggered by a cron job or scheduler
 */

const NotificationService = require('../services/notificationService');

/**
 * Run notification cleanup
 */
async function runCleanup() {
    console.log('[NotificationCleanup] Starting cleanup job...');

    try {
        const result = await NotificationService.cleanupOldNotifications();
        console.log(`[NotificationCleanup] Cleanup completed. Deleted ${result.deletedCount} old notifications.`);
        return result;
    } catch (error) {
        console.error('[NotificationCleanup] Cleanup failed:', error);
        throw error;
    }
}

// If run directly (not imported)
if (require.main === module) {
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');

    dotenv.config();

    // Connect to database
    mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(async () => {
        console.log('[NotificationCleanup] Connected to MongoDB');
        await runCleanup();
        await mongoose.connection.close();
        console.log('[NotificationCleanup] Database connection closed');
        process.exit(0);
    })
    .catch(error => {
        console.error('[NotificationCleanup] Database connection error:', error);
        process.exit(1);
    });
}

module.exports = { runCleanup };
