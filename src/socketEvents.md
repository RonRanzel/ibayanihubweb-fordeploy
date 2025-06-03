# Socket Events for Dashboard Real-Time Updates

To ensure the dashboard updates in real time, your backend should emit the following events via Socket.IO whenever relevant data changes:

- `users_updated`: Emit with the new user list when a user is added, removed, or updated.
- `admins_updated`: Emit with the new admin list when an admin is added, removed, or updated.
- `community_posts_updated`: Emit with the new community posts list when a post is added, removed, or updated.
- `announcements_updated`: Emit with the new announcements list when an announcement is added, removed, or updated.

**Example (Node.js/Express + Socket.IO):**
```js
// After updating users in your user controller
io.emit('users_updated', updatedUserList);

// After updating admins in your admin controller
io.emit('admins_updated', updatedAdminList);

// After updating community posts
io.emit('community_posts_updated', updatedCommunityPosts);

// After updating announcements
io.emit('announcements_updated', updatedAnnouncements);
```

**Note:**
- The dashboard will now update instantly when these events are emitted.
- Make sure your backend emits these events after any relevant database change.
