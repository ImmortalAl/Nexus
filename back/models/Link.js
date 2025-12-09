const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    category: {
        type: String,
        required: true,
        enum: ['knowledge', 'philosophy', 'technology', 'creative', 'community', 'reading']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'removed'],
        default: 'pending'
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvalVotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    removalFlags: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    approvedAt: {
        type: Date
    },
    removedAt: {
        type: Date
    },
    removedReason: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for common queries
linkSchema.index({ status: 1, category: 1 });
linkSchema.index({ status: 1, createdAt: -1 });
linkSchema.index({ url: 1 }, { unique: true });

// Static method to check if a link needs more approvals
linkSchema.methods.needsMoreApprovals = function() {
    return this.approvalVotes.length < 3;
};

// Static method to check if link should be removed due to flags
linkSchema.methods.shouldBeRemoved = function() {
    return this.removalFlags.length >= 5;
};

module.exports = mongoose.model('Link', linkSchema);
