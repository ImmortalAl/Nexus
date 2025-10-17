const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    pollId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    question: {
        type: String,
        required: true
    },
    votes: {
        yes: {
            type: Number,
            default: 0
        },
        no: {
            type: Number,
            default: 0
        }
    },
    voters: [{
        ipHash: {
            type: String,
            required: true
        },
        vote: {
            type: String,
            required: true,
            enum: ['yes', 'no']
        },
        votedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Create compound index for faster voter lookups
pollSchema.index({ pollId: 1, 'voters.ipHash': 1 });

// Method to check if IP has voted
pollSchema.methods.hasVoted = function(ipHash) {
    return this.voters.some(voter => voter.ipHash === ipHash);
};

// Method to get user's vote
pollSchema.methods.getUserVote = function(ipHash) {
    const voter = this.voters.find(voter => voter.ipHash === ipHash);
    return voter ? voter.vote : null;
};

// Method to add a vote
pollSchema.methods.addVote = function(ipHash, vote) {
    if (this.hasVoted(ipHash)) {
        throw new Error('Already voted');
    }

    this.voters.push({ ipHash, vote });
    this.votes[vote]++;
};

// Method to get results
pollSchema.methods.getResults = function(ipHash = null) {
    const results = {
        pollId: this.pollId,
        yes: this.votes.yes,
        no: this.votes.no,
        total: this.votes.yes + this.votes.no,
        hasVoted: false,
        userVote: null
    };

    if (ipHash) {
        results.hasVoted = this.hasVoted(ipHash);
        results.userVote = this.getUserVote(ipHash);
    }

    return results;
};

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;
