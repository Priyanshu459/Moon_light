import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import apiClient, { MEDIA_URL } from '../../api/client';
import { colors, typography, layout } from '../../theme/theme';
import { LogOut, Grid3x3, Settings, Camera } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProfileScreen({ route, navigation }: any) {
  const { user, logout } = useContext(AuthContext);
  const targetUsername = route?.params?.username || user?.username;
  const isCurrentUser = user?.username === targetUsername;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUsername) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/users/${targetUsername}`);
        setProfile(res.data);
        if (!isCurrentUser && res.data.id) {
          try {
            const followRes = await apiClient.get(`/follows/${res.data.id}/followers`);
            const isFollowed = (followRes.data || []).some((f: any) => f.id === user?.id);
            setIsFollowing(isFollowed);
          } catch {}
        }
      } catch (e) {
        console.error('Profile fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [targetUsername, isCurrentUser, user]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      await apiClient.post(`/follows/${profile.id}`);
    } catch {
      setIsFollowing(prev);
    }
  };

  if (loading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initials = profile.displayName
    ? profile.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.username?.[0]?.toUpperCase() || '?';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarUsername} numberOfLines={1}>@{profile.username}</Text>
        {isCurrentUser && (
          <TouchableOpacity style={styles.settingsBtn}>
            <Settings size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile header */}
      <View style={styles.profileHeader}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {profile.avatarUrl ? (
            <Image
              source={{ uri: `${MEDIA_URL}${profile.avatarUrl}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {isCurrentUser && (
            <View style={styles.cameraBtn}>
              <Camera size={14} color={colors.textOnPrimary} />
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile._count?.posts || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile._count?.followedBy || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile._count?.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      {/* Name & Bio */}
      <View style={styles.bioSection}>
        <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
        {profile.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : isCurrentUser ? (
          <Text style={styles.bioEmpty}>Add a bio to tell people about yourself</Text>
        ) : null}
      </View>

      {/* Action button */}
      <View style={styles.actionRow}>
        {isCurrentUser ? (
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.editBtn, isFollowing && styles.followingBtn]}
            onPress={handleFollowToggle}
          >
            <Text style={[styles.editBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? '✓ Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Posts section tab */}
      <View style={styles.postsTab}>
        <View style={styles.postsTabActive}>
          <Grid3x3 size={18} color={colors.primary} />
          <Text style={styles.postsTabText}>Posts</Text>
        </View>
      </View>

      {/* Empty posts grid */}
      <View style={styles.emptyGrid}>
        <View style={styles.emptyIconWrap}>
          <Camera size={34} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>No Posts Yet</Text>
        <Text style={styles.emptySubtitle}>
          {isCurrentUser ? 'Share your first moment with Moon Light!' : 'Nothing posted yet.'}
        </Text>
      </View>

      {/* Logout */}
      {isCurrentUser && (
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={18} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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
    backgroundColor: colors.background,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarUsername: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  settingsBtn: { padding: 4 },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },

  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  statNumber: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 3,
  },

  bioSection: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  displayName: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bio: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bioEmpty: {
    ...typography.body2,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  actionRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: layout.radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  followingBtn: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  followingBtnText: {
    color: colors.primary,
  },

  postsTab: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
  },
  postsTabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  postsTabText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },

  emptyGrid: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    backgroundColor: `${colors.error}0D`,
  },
  logoutText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.error,
  },
});
