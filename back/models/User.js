const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    email: {
        type: String,
        required: false,
        unique: true,
        default: ''
    },
    displayName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    avatar: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    online: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    banned: {
        type: Boolean,
        default: false
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpiry: {
        type: Date,
        default: null
    },
    passwordResetRequested: {
        type: Boolean,
        default: false
    },
    resetRequestId: {
        type: String,
        default: null
    },
    resetRequestedAt: {
        type: Date,
        default: null
    },
    resetStatus: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'active', null],
        default: null
    },
    seed: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    credibility: {
        totalUpvotes: {
            type: Number,
            default: 0
        },
        totalDownvotes: {
            type: Number,
            default: 0
        },
        netScore: {
            type: Number,
            default: 0
        },
        tier: {
            type: String,
            enum: ['elevated', 'neutral', 'below'],
            default: 'neutral'
        },
        breakdown: {
            blogs: {
                upvotes: { type: Number, default: 0 },
                downvotes: { type: Number, default: 0 }
            },
            comments: {
                upvotes: { type: Number, default: 0 },
                downvotes: { type: Number, default: 0 }
            },
            threads: {
                upvotes: { type: Number, default: 0 },
                downvotes: { type: Number, default: 0 }
            },
            nodes: {
                upvotes: { type: Number, default: 0 },
                downvotes: { type: Number, default: 0 }
            },
            chronicles: {
                upvotes: { type: Number, default: 0 },
                downvotes: { type: Number, default: 0 }
            }
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Hash the password before saving the user
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;