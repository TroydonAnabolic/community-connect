// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useNotificationsStore } from '@/store/notificationsStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name, focused, label, badge,
}: {
  name: IoniconName; focused: boolean; label: string; badge?: number;
}) {
  const iconName: IoniconName = focused ? name : (`${name}-outline` as IoniconName);
  return (
    <View style={styles.tabItem} accessibilityLabel={label}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={26} color={focused ? Colors.primary : Colors.textTertiary} />
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const unreadMessages = useUnreadMessages();
  const { unreadCount: unreadNotifs } = useNotificationsStore();

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
      <Tabs.Screen
        name="community"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} label="Community" />,
          tabBarAccessibilityLabel: 'Community',
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} label="Events" />,
          tabBarAccessibilityLabel: 'Events',
        }}
      />
      <Tabs.Screen
        name="wellbeing"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="heart" focused={focused} label="Wellbeing" />,
          tabBarAccessibilityLabel: 'Wellbeing',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubbles" focused={focused} label="Messages" badge={unreadMessages} />
          ),
          tabBarAccessibilityLabel: `Messages${unreadMessages > 0 ? `, ${unreadMessages} unread` : ''}`,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} label="Profile" badge={unreadNotifs} />
          ),
          tabBarAccessibilityLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconWrap: { position: 'relative' },
  badge: {
    position: 'absolute', top: -4, right: -10,
    backgroundColor: Colors.error, borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: Colors.surface,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tabLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});
