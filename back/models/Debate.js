const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceType: { type: String, enum: ['scroll', 'general'], default: 'general' },
  sourceScrollId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', default: null },
  originalAuthor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['active', 'resolved', 'archived'], default: 'active' },
  votes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['for', 'against'] }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Debate', debateSchema);