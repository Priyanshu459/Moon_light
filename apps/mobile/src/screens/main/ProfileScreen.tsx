import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import apiClient, { MEDIA_URL } from '../../api/client';
import { colors, layout } from '../../theme/theme';
import { LogOut, Grid3x3, Settings } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.username) {
        try {
          const response = await apiClient.get(`/users/${user.username}`);
          setProfile(response.data);
        } catch (error) {
          console.error('Failed to fetch profile', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user]);

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarUsername}>@{profile.username}</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Settings size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {profile.avatarUrl ? (
            <Image
              source={{ uri: `${MEDIA_URL}${profile.avatarUrl}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile._count?.posts || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      {/* Name & Bio */}
      <View style={styles.bioSection}>
        <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionTab}>
          <Grid3x3 size={20} color={colors.primary} />
        </View>
      </View>

      {/* Empty Grid State */}
      <View style={styles.emptyGrid}>
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyTitle}>No Posts Yet</Text>
        <Text style={styles.emptySubtitle}>Share your first moment!</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <LogOut size={18} color={colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },

  // Top bar
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingsBtn: {
    padding: 4,
  },

  // Profile header row
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  avatarWrapper: {
    marginRight: 24,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Bio section
  bioSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Actions
  actionRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Section tabs
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sectionTab: {
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingHorizontal: 24,
  },

  // Empty grid
  emptyGrid: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 14,
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: colors.error + '40',
    backgroundColor: colors.error + '08',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
});
