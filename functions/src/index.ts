// functions/src/index.ts
// Deploy: firebase deploy --only functions

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// ─────────────────────────────────────────────────
// 1. NEW USER: send welcome notification
// ─────────────────────────────────────────────────
export const onNewUser = functions.firestore
  .document('users/{uid}')
  .onCreate(async (snap, context) => {
    const { uid } = context.params;
    const user = snap.data();

    await db.collection('notifications').add({
      userId: uid,
      type: 'welcome',
      title: `Welcome, ${user.displayName}! 👋`,
      body: 'We\'re glad you\'re here. Explore discussions, find events, and connect with your community.',
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

// ─────────────────────────────────────────────────
// 2. NEW COMMENT: notify post author
// ─────────────────────────────────────────────────
export const onNewComment = functions.firestore
  .document('posts/{postId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const { postId } = context.params;
    const comment = snap.data();

    const postSnap = await db.collection('posts').doc(postId).get();
    if (!postSnap.exists) return;
    const post = postSnap.data()!;

    // Don't notify if commenter is the post author
    if (post.authorId === comment.authorId) return;

    // Create in-app notification
    await db.collection('notifications').add({
      userId: post.authorId,
      type: 'new_comment',
      title: `${comment.authorName} commented on your post`,
      body: comment.body.slice(0, 100),
      data: { postId },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send push notification
    const authorSnap = await db.collection('users').doc(post.authorId).get();
    const fcmToken = authorSnap.data()?.fcmToken;
    if (fcmToken) {
      await messaging.send({
        token: fcmToken,
        notification: {
          title: `${comment.authorName} replied`,
          body: comment.body.slice(0, 100),
        },
        data: { postId, screen: 'post' },
        android: { priority: 'normal' },
      }).catch(() => {}); // ignore stale tokens
    }
  });

// ─────────────────────────────────────────────────
// 3. NEW MESSAGE: notify recipient
// ─────────────────────────────────────────────────
export const onNewMessage = functions.firestore
  .document('conversations/{convId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const { convId } = context.params;
    const message = snap.data();

    const convSnap = await db.collection('conversations').doc(convId).get();
    if (!convSnap.exists) return;
    const conv = convSnap.data()!;

    // Find recipient
    const recipientId = (conv.participants as string[]).find(
      (uid: string) => uid !== message.senderId
    );
    if (!recipientId) return;

    // In-app notification
    await db.collection('notifications').add({
      userId: recipientId,
      type: 'new_message',
      title: `New message from ${message.senderName}`,
      body: message.body.slice(0, 100),
      data: { chatId: convId },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Push notification
    const recipientSnap = await db.collection('users').doc(recipientId).get();
    const fcmToken = recipientSnap.data()?.fcmToken;
    if (fcmToken) {
      await messaging.send({
        token: fcmToken,
        notification: {
          title: message.senderName,
          body: message.body.slice(0, 100),
        },
        data: { chatId: convId, screen: 'chat' },
        android: {
          priority: 'high',
          notification: { channelId: 'default' },
        },
      }).catch(() => {});
    }
  });

// ─────────────────────────────────────────────────
// 4. MISSED CHECK-IN: alert trusted contacts
//    Runs daily at 8pm via Cloud Scheduler
// ─────────────────────────────────────────────────
export const dailyMissedCheckInAlert = functions.pubsub
  .schedule('0 20 * * *')
  .timeZone('Pacific/Auckland')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Get all seniors and caregivers
    const usersSnap = await db.collection('users')
      .where('role', 'in', ['senior', 'caregiver'])
      .where('isBanned', '==', false)
      .get();

    const promises = usersSnap.docs.map(async (userDoc) => {
      const user = userDoc.data();
      const uid = userDoc.id;
      if (!user.trustedContacts?.length) return;

      // Check if there's a check-in today
      const checkInsSnap = await db
        .collection('check_ins')
        .doc(uid)
        .collection('entries')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startOfToday))
        .limit(1)
        .get();

      if (!checkInsSnap.empty) return; // Already checked in today

      // Notify trusted contacts
      const notifPromises = (user.trustedContacts as string[]).map((contactUid: string) =>
        db.collection('notifications').add({
          userId: contactUid,
          type: 'safety_alert',
          title: `${user.displayName} hasn't checked in today`,
          body: 'They may need a friendly call or visit to make sure they\'re okay.',
          data: { alertFor: uid },
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );

      // Also push-notify trusted contacts
      const pushPromises = (user.trustedContacts as string[]).map(async (contactUid: string) => {
        const contactSnap = await db.collection('users').doc(contactUid).get();
        const fcmToken = contactSnap.data()?.fcmToken;
        if (!fcmToken) return;
        return messaging.send({
          token: fcmToken,
          notification: {
            title: `⚠️ ${user.displayName} hasn't checked in`,
            body: 'Tap to view — they may need your support.',
          },
          data: { alertFor: uid, screen: 'wellbeing' },
          android: {
            priority: 'high',
            notification: { channelId: 'wellbeing' },
          },
        }).catch(() => {});
      });

      return Promise.all([...notifPromises, ...pushPromises]);
    });

    await Promise.all(promises);
    console.log(`Missed check-in scan complete. Checked ${usersSnap.size} users.`);
  });

// ─────────────────────────────────────────────────
// 5. DAILY WELLBEING PROMPT: 9am push to all users
// ─────────────────────────────────────────────────
export const dailyWellbeingPrompt = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Pacific/Auckland')
  .onRun(async () => {
    const usersSnap = await db.collection('users')
      .where('isBanned', '==', false)
      .get();

    const batchSize = 500;
    const tokens: string[] = [];

    usersSnap.docs.forEach((d) => {
      const token = d.data().fcmToken;
      if (token) tokens.push(token);
    });

    // FCM multicast in batches of 500
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: 'Good morning! 🌿',
          body: 'How are you feeling today? Tap to complete your daily check-in.',
        },
        data: { screen: 'wellbeing' },
        android: {
          priority: 'normal',
          notification: { channelId: 'wellbeing' },
        },
      }).catch(() => {});
    }

    console.log(`Wellbeing prompt sent to ${tokens.length} users.`);
  });

// ─────────────────────────────────────────────────
// 6. EVENT REMINDERS: 1 hour before start
//    Runs every hour
// ─────────────────────────────────────────────────
export const eventReminders = functions.pubsub
  .schedule('0 * * * *')
  .onRun(async () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const eventsSnap = await db.collection('events')
      .where('modStatus', '==', 'approved')
      .where('startsAt', '>=', admin.firestore.Timestamp.fromDate(oneHourLater))
      .where('startsAt', '<=', admin.firestore.Timestamp.fromDate(twoHoursLater))
      .get();

    const promises = eventsSnap.docs.map(async (eventDoc) => {
      const event = eventDoc.data();
      const rsvpList = event.rsvpList as string[] ?? [];

      // Notify each RSVP'd user
      const notifPromises = rsvpList.map(async (uid: string) => {
        await db.collection('notifications').add({
          userId: uid,
          type: 'event_reminder',
          title: `Starting soon: ${event.title}`,
          body: `Your event starts in about 1 hour at ${event.location}`,
          data: { eventId: eventDoc.id },
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const userSnap = await db.collection('users').doc(uid).get();
        const fcmToken = userSnap.data()?.fcmToken;
        if (fcmToken) {
          return messaging.send({
            token: fcmToken,
            notification: {
              title: `⏰ Starting in 1 hour: ${event.title}`,
              body: event.location,
            },
            data: { eventId: eventDoc.id, screen: 'event' },
          }).catch(() => {});
        }
      });

      return Promise.all(notifPromises);
    });

    await Promise.all(promises);
    console.log(`Event reminders sent for ${eventsSnap.size} events.`);
  });

// ─────────────────────────────────────────────────
// 7. AUTO MODERATION: flag high-toxicity posts
//    Called when a new post is created
// ─────────────────────────────────────────────────
export const autoModeratePost = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    const { postId } = context.params;
    const post = snap.data();

    // Simple keyword list — replace with Perspective API call in production:
    // https://developers.perspectiveapi.com/s/docs-get-started
    const flaggedWords = ['spam', 'scam', 'fraud', 'abuse'];
    const bodyLower = post.body.toLowerCase();
    const isFlagged = flaggedWords.some((w) => bodyLower.includes(w));

    if (isFlagged) {
      // Hold for human review
      await db.collection('posts').doc(postId).update({ modStatus: 'pending' });
      await db.collection('mod_queue').add({
        contentType: 'post',
        contentId: postId,
        contentPreview: post.body.slice(0, 200),
        authorId: post.authorId,
        authorName: post.authorName,
        reportCount: 0,
        reportReasons: ['auto-flagged: keyword match'],
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

// ─────────────────────────────────────────────────
// 8. AGGREGATE ANALYTICS: daily summary
//    Runs at midnight
// ─────────────────────────────────────────────────
export const aggregateDailyStats = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Pacific/Auckland')
  .onRun(async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const [totalUsers, newUsers, newPosts, newEvents] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('users')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endOfYesterday))
        .count().get(),
      db.collection('posts')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endOfYesterday))
        .count().get(),
      db.collection('events')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endOfYesterday))
        .count().get(),
    ]);

    await db.collection('analytics').doc(yesterday.toISOString().split('T')[0]).set({
      date: admin.firestore.Timestamp.fromDate(yesterday),
      totalUsers: totalUsers.data().count,
      newUsers: newUsers.data().count,
      newPosts: newPosts.data().count,
      newEvents: newEvents.data().count,
      computedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Daily analytics aggregated.');
  });
