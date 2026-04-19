// components/ui/UserProfileCard.tsx
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { UserProfile } from '@/types';
import { RoleBadge } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileCardProps {
  user: UserProfile;
  onPress?: () => void;
  onMessage?: () => void;
  showLastSeen?: boolean;
  compact?: boolean;
}

export default function UserProfileCard({
  user, onPress, onMessage, showLastSeen = false, compact = false,
}: UserProfileCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`${user.displayName}, ${user.role}`}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarInitial}>
            {user.displayName.charAt(0).toUpperCase()}
          </Text>
        )}
        {/* Online indicator — could hook into lastSeen in production */}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{user.displayName}</Text>
          {user.isVerified && (
            <Ionicons name="checkmark-circle" size={15} color={Colors.primary} style={styles.verifiedIcon} />
          )}
        </View>
        <RoleBadge role={user.role} />
        {user.bio && !compact && (
          <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
        )}
        {user.location && !compact && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
        )}
        {showLastSeen && (
          <Text style={styles.lastSeen}>
            Active {formatDistanceToNow(user.lastSeen, { addSuffix: true })}
          </Text>
        )}
      </View>

      {/* Message action */}
      {onMessage && (
        <TouchableOpacity
          style={styles.msgBtn}
          onPress={onMessage}
          accessibilityLabel={`Message ${user.displayName}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  cardCompact: { paddingVertical: Spacing.md },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: { width: 50, height: 50 },
  avatarInitial: { fontSize: FontSizes.xl, fontWeight: '700', color: '#fff' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  name: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  verifiedIcon: { flexShrink: 0 },
  bio: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 18, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  location: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  lastSeen: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 3 },
  msgBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
