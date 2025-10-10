const express = require('express');
const router = express.Router();

// Error reporting endpoint for client-side error tracking
router.post('/report', async (req, res) => {
    try {
        const { message, stack, url, lineNumber, columnNumber, timestamp, userAgent, userId } = req.body;

        // Log error to console (could also save to database)
        console.error('[Client Error Report]', {
            message,
            url,
            lineNumber,
            columnNumber,
            timestamp: new Date(timestamp),
            userAgent,
            userId: userId || 'anonymous',
            stack: stack ? stack.substring(0, 500) : 'No stack trace' // Limit stack trace length
        });

        // Acknowledge receipt
        res.status(200).json({
            success: true,
            message: 'Error report received'
        });
    } catch (error) {
        console.error('Error processing error report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process error report'
        });
    }
});

module.exports = router;
