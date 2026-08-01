import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient, { MEDIA_URL } from '../../api/client';
import { colors, typography, layout } from '../../theme/theme';
import { Notification } from '../../types/api';
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react-native';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ICON_MAP: Record<string, { icon: JSX.Element; color: string }> = {
  LIKE: {
    icon: <Heart size={20} color="#F43F5E" fill="#F43F5E" />,
    color: 'rgba(244,63,94,0.15)',
  },
  COMMENT: {
    icon: <MessageCircle size={20} color="#7C6FF7" />,
    color: 'rgba(124,111,247,0.15)',
  },
  FOLLOW: {
    icon: <UserPlus size={20} color="#34D399" />,
    color: 'rgba(52,211,153,0.15)',
  },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data || []);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationText = (item: Notification) => {
    const name = item.triggerUser?.displayName || item.triggerUser?.username || 'Someone';
    if (item.type === 'LIKE') return `${name} liked your post`;
    if (item.type === 'COMMENT') return `${name} commented on your post`;
    if (item.type === 'FOLLOW') return `${name} started following you`;
    return 'You have a new notification';
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const meta = ICON_MAP[item.type] || {
      icon: <Bell size={20} color={colors.textSecondary} />,
      color: colors.surfaceElevated,
    };

    const triggerUser = item.triggerUser;
    const initials = triggerUser?.displayName
      ? triggerUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : triggerUser?.username?.[0]?.toUpperCase() || '?';

    return (
      <View style={[styles.notifCard, !item.read && styles.unreadCard]}>
        {/* Unread dot */}
        {!item.read && <View style={styles.unreadDot} />}

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {triggerUser?.avatarUrl ? (
            <Image
              source={{ uri: `${MEDIA_URL}${triggerUser.avatarUrl}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {/* Icon badge */}
          <View style={[styles.iconBadge, { backgroundColor: meta.color }]}>
            {meta.icon}
          </View>
        </View>

        <View style={styles.notifContent}>
          <Text style={styles.notifText}>{getNotificationText(item)}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(n => !n.read) && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notifications.filter(n => !n.read).length} new
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Bell size={52} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>
                When someone likes, comments, or follows you — it'll appear here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: layout.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeText: {
    ...typography.label,
    color: colors.primary,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: layout.radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  unreadCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarInitials: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },

  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifText: {
    ...typography.body2,
    color: colors.textPrimary,
    lineHeight: 20,
    paddingRight: 16,
  },
  notifTime: {
    ...typography.caption,
    color: colors.textMuted,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
