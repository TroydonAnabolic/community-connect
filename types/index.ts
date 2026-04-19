// types/index.ts — central type definitions

export type UserRole = 'senior' | 'caregiver' | 'organisation' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  phone?: string;
  location?: string;
  organisation?: string;
  trustedContacts: string[]; // uids
  fcmToken?: string;
  accessibilityPrefs: AccessibilityPrefs;
  isVerified: boolean;
  isBanned: boolean;
  createdAt: Date;
  lastSeen: Date;
}

export interface AccessibilityPrefs {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  reduceMotion: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  category: PostCategory;
  title?: string;
  body: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  modStatus: 'approved' | 'pending' | 'removed';
  likeCount: number;
  commentCount: number;
  likedBy: string[];
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PostCategory =
  | 'general'
  | 'safety'
  | 'health'
  | 'social'
  | 'news'
  | 'support'
  | 'announcements';

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  body: string;
  likeCount: number;
  likedBy: string[];
  modStatus: 'approved' | 'pending' | 'removed';
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostPhotoURL?: string;
  category: EventCategory;
  location: string;
  locationCoords?: { lat: number; lng: number };
  startsAt: Date;
  endsAt: Date;
  isOnline: boolean;
  onlineUrl?: string;
  maxAttendees?: number;
  rsvpCount: number;
  rsvpList: string[]; // uids
  imageUrl?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  modStatus: 'approved' | 'pending' | 'removed';
  createdAt: Date;
}

export type EventCategory =
  | 'social'
  | 'health'
  | 'arts'
  | 'technology'
  | 'outdoors'
  | 'education'
  | 'support_group'
  | 'other';

export interface DirectMessage {
  id: string;
  participants: string[]; // [uid1, uid2]
  lastMessage: string;
  lastMessageAt: Date;
  lastMessageBy: string;
  unreadCount: { [uid: string]: number };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface CheckIn {
  id: string;
  userId: string;
  moodScore: 1 | 2 | 3 | 4 | 5;
  safetyOk: boolean;
  notes?: string;
  visibleTo: string[]; // trusted contact uids
  timestamp: Date;
}

export interface WellbeingContent {
  id: string;
  type: 'tip' | 'article' | 'video' | 'checkin_prompt';
  title: string;
  body: string;
  imageUrl?: string;
  category: 'safety' | 'health' | 'social' | 'mental_health' | 'exercise';
  publishedAt: Date;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'event_reminder'
  | 'new_comment'
  | 'new_message'
  | 'checkin_prompt'
  | 'safety_alert'
  | 'welcome'
  | 'post_approved';

export interface ModQueueItem {
  id: string;
  contentType: 'post' | 'comment' | 'event';
  contentId: string;
  contentPreview: string;
  authorId: string;
  authorName: string;
  reportCount: number;
  reportReasons: string[];
  status: 'pending' | 'approved' | 'removed' | 'warned';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface EngagementStats {
  dau: number;
  wau: number;
  mau: number;
  totalUsers: number;
  totalPosts: number;
  totalEvents: number;
  totalCheckIns: number;
  newUsersToday: number;
  activeEventsThisWeek: number;
  checkInCompletionRate: number;
  usersByRole: Record<UserRole, number>;
}
