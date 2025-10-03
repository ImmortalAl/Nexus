const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 10
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Ideas', 'Debates', 'Trades', 'Events', 'Governance', 'Anonymous Whispers'],
        default: 'Ideas'
    },
    tags: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    replies: [{
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 1
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        editedAt: {
            type: Date,
            default: null
        },
        editHistory: [{
            editedAt: {
                type: Date,
                default: Date.now
            },
            originalContent: {
                type: String,
                required: true
            }
        }],
        isAnonymous: {
            type: Boolean,
            default: false
        },
        anonymousDisplayName: {
            type: String,
            trim: true,
            maxlength: 50,
            default: null
        },
        // Reply voting system
        votes: {
            upvotes: [{
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }],
            downvotes: [{
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }]
        },
        voteScore: {
            type: Number,
            default: 0
        }
    }],
    isLocked: {
        type: Boolean,
        default: false
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    anonymousDisplayName: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null
    },
    // Voting system fields
    votes: {
        upvotes: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        downvotes: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    voteScore: {
        type: Number,
        default: 0
    },
    // Governance-specific fields
    isProposal: {
        type: Boolean,
        default: false
    },
    proposalData: {
        type: {
            type: String,
            enum: [
                'feature_request',
                'policy_change',
                'moderation_decision',
                'content_guideline',
                'community_standard',
                'resource_allocation',
                'platform_improvement'
            ],
            required: function() { return this.isProposal; }
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
            required: function() { return this.isProposal; }
        },
        estimatedEffort: {
            type: String,
            enum: ['minimal', 'low', 'medium', 'high', 'extensive'],
            default: 'medium',
            required: function() { return this.isProposal; }
        },
        deadline: {
            type: Date,
            default: null
        }
    }
});

module.exports = mongoose.model('Thread', threadSchema);