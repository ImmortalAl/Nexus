const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chronicleHistorySchema = new Schema({
    chronicle: {
        type: Schema.Types.ObjectId,
        ref: 'Chronicle',
        required: true,
        index: true
    },
    editor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Store the previous state before the edit
    previousTitle: {
        type: String,
        required: true
    },
    previousContent: {
        type: String,
        required: true
    },
    previousEventDate: {
        type: Date,
        required: true
    },
    previousSources: [{
        type: String
    }],
    // Store what changed
    changedFields: [{
        type: String,
        enum: ['title', 'content', 'eventDate', 'sources']
    }],
    // Optional edit summary/note
    editSummary: {
        type: String
    }
}, {
    timestamps: true // Will give us createdAt for when the edit happened
});

// Index for efficient queries
chronicleHistorySchema.index({ chronicle: 1, createdAt: -1 });

const ChronicleHistory = mongoose.model('ChronicleHistory', chronicleHistorySchema);

module.exports = ChronicleHistory;
