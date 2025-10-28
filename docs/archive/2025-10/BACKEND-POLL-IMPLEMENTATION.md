# Backend Poll API Implementation Guide

## Overview
This document describes the backend API endpoints needed for the Immortal Poll system with IP-based vote limiting.

## Required Backend Endpoints

### 1. GET `/api/poll/:pollId`
**Purpose**: Retrieve poll results and check if IP has voted

**Request**:
- No body
- Server should capture requester's IP address from request headers

**Response**:
```json
{
  "pollId": "censorship-justified",
  "yes": 45,
  "no": 78,
  "total": 123,
  "hasVoted": false,
  "userVote": null
}
```

**Logic**:
1. Get client IP from request (Express: `req.ip` or `req.headers['x-forwarded-for']`)
2. Hash the IP using crypto (e.g., SHA-256)
3. Check database if this IP hash has voted for this poll
4. Return results + voting status

### 2. POST `/api/poll/:pollId/vote`
**Purpose**: Submit a vote

**Request**:
```json
{
  "vote": "yes" | "no"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "results": {
    "pollId": "censorship-justified",
    "yes": 46,
    "no": 78,
    "total": 124,
    "hasVoted": true,
    "userVote": "yes"
  }
}
```

**Response** (Already Voted):
```json
{
  "success": false,
  "message": "You have already voted in this poll"
}
```

**Logic**:
1. Get client IP and hash it
2. Check if IP hash exists in votes for this poll
3. If already voted, return error
4. If not voted:
   - Increment vote count for chosen option
   - Store IP hash + vote choice in database
   - Return updated results

## Database Schema

### Poll Schema
```javascript
{
  pollId: String (unique index),
  question: String,
  votes: {
    yes: Number (default: 0),
    no: Number (default: 0)
  },
  voters: [
    {
      ipHash: String (unique within poll),
      vote: String ('yes' | 'no'),
      votedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## IP Hashing Implementation (Node.js/Express)

```javascript
const crypto = require('crypto');

// Get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress;
}

// Hash IP for privacy
function hashIP(ip) {
  return crypto.createHash('sha256')
    .update(ip + process.env.IP_HASH_SALT) // Add salt from env
    .digest('hex');
}

// Example usage
const clientIP = getClientIP(req);
const ipHash = hashIP(clientIP);
```

## Security Considerations

1. **Salt the hash**: Use environment variable for salt
2. **Don't store raw IPs**: Only store hashes
3. **Rate limiting**: Prevent spam voting attempts
4. **Input validation**: Validate vote value is 'yes' or 'no'
5. **Error handling**: Graceful failures

## Initialization

When backend starts, ensure poll exists:

```javascript
// Initialize default poll if doesn't exist
Poll.findOneAndUpdate(
  { pollId: 'censorship-justified' },
  {
    $setOnInsert: {
      question: 'Is censorship ever justified?',
      votes: { yes: 0, no: 0 },
      voters: []
    }
  },
  { upsert: true, new: true }
);
```

## Testing Checklist

- [ ] Can retrieve poll results
- [ ] Can submit first vote
- [ ] Cannot vote twice from same IP
- [ ] Results update correctly
- [ ] IP hashing works properly
- [ ] Error messages are clear
- [ ] Rate limiting prevents spam

## Frontend Integration

Frontend expects:
- Poll endpoint at: `${API_BASE_URL}/poll/:pollId`
- Vote endpoint at: `${API_BASE_URL}/poll/:pollId/vote`
- Standard JSON responses as documented above

---

**Note**: This is a simplified IP-based system that will block 95% of duplicate votes. Users with VPNs or dynamic IPs could potentially vote multiple times, but this is acceptable for a casual public poll.
