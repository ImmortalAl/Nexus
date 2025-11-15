# Courier Pigeon Notification System

## Overview

The Courier Pigeon is Immortal Nexus's real-time notification system. It delivers notifications for user interactions, system events, and important updates through an elegant pigeon-themed interface.

**Created:** 2025-11-15
**Status:** Production Ready
**Version:** 1.0

---

## Architecture

### Backend Components

1. **Notification Model** (`back/models/Notification.js`)
   - MongoDB schema for persistent storage
   - Tracks notification type, title, message, read status
   - 90-day retention for read notifications
   - Indexes for efficient querying

2. **Notification Service** (`back/services/notificationService.js`)
   - Centralized notification creation and management
   - Helper methods for different notification types
   - Integrated with WebSocket for real-time delivery
   - Cleanup utilities for old notifications

3. **Notification Routes** (`back/routes/notifications.js`)
   - REST API endpoints for notification CRUD operations
   - Admin broadcast functionality
   - Manual cleanup trigger (admin only)

4. **WebSocket Integration** (`back/websocket.js`)
   - Real-time notification delivery to online users
   - Notification count updates
   - Persistent connection management

5. **Cleanup Job** (`back/jobs/notificationCleanup.js`)
   - Automated cleanup of read notifications older than 90 days
   - Can be run manually or via cron job

### Frontend Components

1. **NotificationManager** (`front/components/shared/notificationManager.js`)
   - Fetches notifications from API
   - Connects to WebSocket for real-time updates
   - Displays toast notifications
   - Manages notification state

2. **NotificationIcon** (`front/components/shared/notificationIcon.js`)
   - Courier pigeon icon in header
   - Badge with unread count
   - Dropdown (desktop) and modal (mobile) views
   - Mark as read functionality

3. **Notification CSS** (`front/css/notifications.css`)
   - Responsive styling for all components
   - Light/dark theme support
   - Toast animations
   - Mobile-first design

---

## Notification Types

| Type | Description | Triggers |
|------|-------------|----------|
| `message` | New private message | User sends private message |
| `comment_reply` | Reply to user's comment | Someone replies to comment |
| `chronicle_comment` | Comment on user's chronicle | Comment on Chronicle post |
| `echo_comment` | Comment on user's echo | Comment on Echoes Unbound post |
| `governance_update` | Governance/democracy update | Proposal created, voting started, etc. |
| `moderation_action` | Community moderation action | Content moderated |
| `admin_broadcast` | Admin announcement | Admin sends broadcast |
| `soul_interaction` | Soul Scrolls interaction | Someone views/interacts with soul |
| `mention` | User was mentioned | @ mention in content |
| `clash_update` | Clash of Immortals update | (Future) Game event |
| `vault_notification` | Timeless Vault notification | (Future) Archive event |

---

## API Endpoints

### User Endpoints

```
GET    /api/notifications              # Fetch notifications
GET    /api/notifications/count        # Get unread count
PATCH  /api/notifications/:id/read     # Mark notification as read
PATCH  /api/notifications/read-all     # Mark all as read
DELETE /api/notifications/:id          # Delete notification
```

### Admin Endpoints

```
POST   /api/notifications/broadcast    # Broadcast to all users
POST   /api/notifications/cleanup      # Trigger manual cleanup
```

---

## Usage Examples

### Backend: Creating Notifications

```javascript
const NotificationService = require('../services/notificationService');

// Message notification
await NotificationService.notifyNewMessage(
    recipientId,
    senderId,
    senderUsername,
    messageId,
    messagePreview
);

// Comment reply notification
await NotificationService.notifyCommentReply(
    recipientId,
    replierId,
    replierUsername,
    commentId,
    contentType,
    contentTitle,
    replyPreview
);

// Admin broadcast
await NotificationService.broadcastAdminNotification(
    'Important Announcement',
    'The site will be down for maintenance at 2 AM UTC',
    '/news',
    null // null = all users, or pass array of user IDs
);
```

### Frontend: Accessing Notifications

```javascript
// Get notification manager instance
const manager = window.NEXUSNotifications;

// Subscribe to events
manager.on('newNotification', (notification) => {
    console.log('New notification:', notification);
});

manager.on('countUpdate', (count) => {
    console.log('Unread count:', count);
});

// Get current notifications
const notifications = manager.getNotifications();
const unreadCount = manager.getUnreadCount();

// Mark as read
await manager.markAsRead(notificationId);
await manager.markAllAsRead();
```

---

## Notification Flow

### 1. Trigger Event
User performs action (sends message, comments, etc.)

### 2. Backend Processing
- Event handler calls NotificationService
- Notification created in database
- Notification sent via WebSocket to online users

### 3. Frontend Display
- NotificationManager receives WebSocket message
- Toast notification displays (if user is online)
- Badge count updates on pigeon icon
- Notification appears in dropdown/modal

### 4. User Interaction
- User clicks notification → opens link + marks as read
- User clicks mark as read button → marks as read without navigating
- User clicks "mark all as read" → clears all unread notifications

### 5. Cleanup (90 days)
- Cron job runs notification cleanup
- Read notifications older than 90 days are deleted
- Unread notifications retained indefinitely

---

## Deployment

### Backend Deployment

1. **Environment Variables** (already configured):
   ```
   MONGO_URI=<mongodb_connection_string>
   JWT_SECRET=<secret_key>
   ```

2. **Deploy to Render**:
   ```bash
   git add back/
   git commit -m "feat: add courier pigeon notification system backend"
   git push origin main
   ```

3. **Setup Cron Job** (optional):
   Add to Render dashboard or use external cron service:
   ```bash
   0 2 * * * node /path/to/back/jobs/notificationCleanup.js
   ```
   Or run manually via API:
   ```bash
   curl -X POST https://nexus-ytrg.onrender.com/api/notifications/cleanup \
        -H "Authorization: Bearer <admin_token>"
   ```

### Frontend Deployment

1. **Deploy to Netlify**:
   ```bash
   git add front/
   git commit -m "feat: add courier pigeon notification system frontend"
   git push origin main
   ```

2. **Netlify auto-deploys from `front/` directory**

---

## Testing

### Manual Testing Checklist

**Backend:**
- [x] Create notification via API
- [x] Fetch notifications
- [x] Mark as read
- [x] Delete notification
- [x] Admin broadcast

**Frontend:**
- [ ] Icon displays in header
- [ ] Badge shows correct unread count
- [ ] Dropdown opens (desktop)
- [ ] Modal opens (mobile)
- [ ] Toast notifications appear
- [ ] Click notification → navigates + marks as read
- [ ] Mark all as read works
- [ ] WebSocket reconnects after disconnect

**Integration:**
- [ ] Send message → recipient gets notification
- [ ] Post comment → author gets notification
- [ ] Reply to comment → commenter gets notification
- [ ] Real-time delivery via WebSocket

### Testing Script

```bash
# Test notification creation
curl -X POST https://nexus-ytrg.onrender.com/api/messages/send \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"recipientUsername": "testuser", "content": "Test notification"}'

# Verify notification was created
curl https://nexus-ytrg.onrender.com/api/notifications \
  -H "Authorization: Bearer <testuser_token>"
```

---

## Configuration

### Notification Retention

Default: **90 days** for read notifications

To change:
1. Edit `back/models/Notification.js`
2. Update `cleanupOldNotifications()` method
3. Change days calculation: `ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);`

### Toast Duration

Default: **7 seconds**

To change:
1. Edit `front/components/shared/notificationManager.js`
2. Update timeout in `showToast()` method

### WebSocket Reconnection

Default: **5 seconds**

To change:
1. Edit `front/components/shared/notificationManager.js`
2. Update `setTimeout(() => this.connectWebSocket(), 5000);`

---

## Troubleshooting

### Notifications not appearing

**Check:**
1. User is logged in (check localStorage.token)
2. WebSocket connection established (check browser console)
3. Notification API responding (check Network tab)
4. NotificationManager initialized (check window.NEXUSNotifications)

**Debug:**
```javascript
// In browser console
console.log(window.NEXUSNotifications);
console.log(window.NEXUSNotifications.getNotifications());
console.log(window.NEXUSNotifications.getUnreadCount());
```

### WebSocket not connecting

**Check:**
1. Backend is running and accessible
2. JWT token is valid
3. CORS configured correctly
4. WebSocket URL is correct (`wss://nexus-ytrg.onrender.com`)

**Debug:**
```javascript
// In browser console
const ws = new WebSocket('wss://nexus-ytrg.onrender.com?token=' + localStorage.getItem('token'));
ws.onopen = () => console.log('Connected');
ws.onerror = (e) => console.error('Error:', e);
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Badge count incorrect

**Fix:**
```javascript
// Refresh notifications
await window.NEXUSNotifications.fetchNotifications();
```

---

## Future Enhancements

- [ ] Email notifications for offline users
- [ ] Browser push notifications (service worker)
- [ ] Notification preferences per user
- [ ] Notification grouping (e.g., "5 new comments")
- [ ] Sound effects for notifications
- [ ] Notification archive view
- [ ] Notification search/filter

---

## File Structure

```
back/
├── models/
│   └── Notification.js              # MongoDB schema
├── services/
│   └── notificationService.js       # Business logic
├── routes/
│   ├── notifications.js             # API endpoints
│   ├── messages.js                  # (modified for notifications)
│   └── comments.js                  # (modified for notifications)
├── jobs/
│   └── notificationCleanup.js       # Cleanup job
└── websocket.js                     # (modified for notifications)

front/
├── components/shared/
│   ├── notificationManager.js       # Core notification logic
│   ├── notificationIcon.js          # UI component
│   ├── courier-pigeon-icon.svg      # Icon asset
│   └── navigation.js                # (modified to include icon)
└── css/
    └── notifications.css            # Styles
```

---

## Credits

**System Name:** Courier Pigeon Notification System
**Icon Design:** Custom SVG pigeon with scroll
**Architectural Pattern:** Event-driven with real-time WebSocket delivery
**Theme:** Immortal/timeless aesthetic consistent with Nexus design

---

**Last Updated:** 2025-11-15
**Maintained By:** Immortal Nexus Development Team
