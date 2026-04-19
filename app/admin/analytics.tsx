// app/admin/analytics.tsx
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, getDocs, orderBy,
  limit, Timestamp, getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { UserRole } from '@/types';

interface DailyStats { date: string; checkIns: number; posts: number; }

export default function AdminAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    seniorCount: 0,
    caregiverCount: 0,
    orgCount: 0,
    totalPosts: 0,
    totalEvents: 0,
    totalCheckIns: 0,
    activeThisWeek: 0,
    checkInRate: 0,
  });
  const [weeklyTrend, setWeeklyTrend] = useState<DailyStats[]>([]);

  useEffect(() => { loadAnalytics(); }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const now = new Date();
      const weekAgo = subDays(now, 7);

      const [
        totalUsers,
        seniors,
        caregivers,
        orgs,
        totalPosts,
        totalEvents,
        weekPosts,
      ] = await Promise.all([
        getCountFromServer(query(collection(db, 'users'))),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'senior'))),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'caregiver'))),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'organisation'))),
        getCountFromServer(query(collection(db, 'posts'), where('modStatus', '==', 'approved'))),
        getCountFromServer(query(collection(db, 'events'), where('modStatus', '==', 'approved'))),
        getCountFromServer(query(
          collection(db, 'posts'),
          where('createdAt', '>=', Timestamp.fromDate(weekAgo))
        )),
      ]);

      setStats({
        totalUsers: totalUsers.data().count,
        seniorCount: seniors.data().count,
        caregiverCount: caregivers.data().count,
        orgCount: orgs.data().count,
        totalPosts: totalPosts.data().count,
        totalEvents: totalEvents.data().count,
        totalCheckIns: 0, // Aggregated across sub-collections — use Cloud Functions in production
        activeThisWeek: weekPosts.data().count,
        checkInRate: 0,
      });

      // Build last-7-days trend (posts per day)
      const trend: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        const start = Timestamp.fromDate(startOfDay(day));
        const end = Timestamp.fromDate(endOfDay(day));
        const dayPosts = await getCountFromServer(query(
          collection(db, 'posts'),
          where('createdAt', '>=', start),
          where('createdAt', '<=', end)
        ));
        trend.push({
          date: format(day, 'EEE'),
          posts: dayPosts.data().count,
          checkIns: 0, // Placeholder — use aggregation Cloud Function in production
        });
      }
      setWeeklyTrend(trend);
    } finally {
      setLoading(false);
    }
  }

  const maxPosts = Math.max(...weeklyTrend.map((d) => d.posts), 1);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Key metrics */}
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard label="Total Users" value={stats.totalUsers} icon="people" color={Colors.primary} />
          <MetricCard label="Total Posts" value={stats.totalPosts} icon="chatbubbles" color={Colors.accent} />
          <MetricCard label="Events" value={stats.totalEvents} icon="calendar" color={Colors.warning} />
          <MetricCard label="Active (7d)" value={stats.activeThisWeek} icon="pulse" color={Colors.success} />
        </View>

        {/* User breakdown */}
        <Text style={styles.sectionTitle}>Users by Role</Text>
        <View style={styles.breakdownCard}>
          <RoleBar
            role="senior"
            count={stats.seniorCount}
            total={stats.totalUsers}
            color={Colors.primary}
            label="Seniors"
          />
          <RoleBar
            role="caregiver"
            count={stats.caregiverCount}
            total={stats.totalUsers}
            color={Colors.accent}
            label="Caregivers"
          />
          <RoleBar
            role="organisation"
            count={stats.orgCount}
            total={stats.totalUsers}
            color={Colors.warning}
            label="Organisations"
          />
        </View>

        {/* 7-day posts trend */}
        <Text style={styles.sectionTitle}>Posts — Last 7 Days</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {weeklyTrend.map((day) => (
              <View key={day.date} style={styles.barGroup}>
                <Text style={styles.barValue}>{day.posts > 0 ? day.posts : ''}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.max((day.posts / maxPosts) * 100, 4)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day.date}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={loadAnalytics}
          accessibilityLabel="Refresh analytics"
        >
          <Ionicons name="refresh" size={18} color={Colors.primary} />
          <Text style={styles.refreshText}>Refresh Data</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Note: Check-in counts require Cloud Functions aggregation for accurate cross-subcollection totals.
          See the functions/ directory for the aggregation function.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, icon, color }: {
  label: string; value: number; icon: string; color: string;
}) {
  return (
    <View style={[mcStyles.card]}>
      <View style={[mcStyles.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={mcStyles.value}>{value.toLocaleString()}</Text>
      <Text style={mcStyles.label}>{label}</Text>
    </View>
  );
}

function RoleBar({ role, count, total, color, label }: {
  role: string; count: number; total: number; color: string; label: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={rbStyles.row}>
      <Text style={rbStyles.label}>{label}</Text>
      <View style={rbStyles.track}>
        <View style={[rbStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={rbStyles.count}>{count} <Text style={rbStyles.pct}>({pct}%)</Text></Text>
    </View>
  );
}

const mcStyles = StyleSheet.create({
  card: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.borderLight,
  },
  icon: { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.textPrimary },
  label: { fontSize: FontSizes.xs, color: Colors.textTertiary, fontWeight: '500', textAlign: 'center' },
});

const rbStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  label: { width: 90, fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '500' },
  track: {
    flex: 1, height: 10, backgroundColor: Colors.surfaceSecondary,
    borderRadius: 5, overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 5, minWidth: 4 },
  count: { width: 72, fontSize: FontSizes.sm, color: Colors.textPrimary, fontWeight: '700', textAlign: 'right' },
  pct: { fontWeight: '400', color: Colors.textTertiary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary,
    marginBottom: Spacing.md, marginTop: Spacing.lg,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  breakdownCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: 8 },
  barGroup: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 10, color: Colors.textTertiary, marginBottom: 2 },
  barTrack: {
    width: '100%', flex: 1, backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end',
  },
  barFill: { width: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  barLabel: { fontSize: 11, color: Colors.textTertiary, marginTop: 6, fontWeight: '500' },
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.xl, padding: Spacing.md,
  },
  refreshText: { color: Colors.primary, fontWeight: '600', fontSize: FontSizes.md },
  note: {
    fontSize: FontSizes.xs, color: Colors.textTertiary,
    lineHeight: 18, marginTop: Spacing.lg, textAlign: 'center',
  },
});
