import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient, { MEDIA_URL } from '../../api/client';
import { colors, typography, layout } from '../../theme/theme';
import { User, Post } from '../../types/api';
import { Search as SearchIcon, User as UserIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigation = useNavigation<any>();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
      setUsers(res.data.users || []);
    } catch (e) {
      console.error('Search error:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const initials = item.displayName
      ? item.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : item.username?.[0]?.toUpperCase() || '?';

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => navigation.navigate('Profile', { username: item.username })}
        activeOpacity={0.75}
      >
        <View style={styles.avatarRing}>
          {item.avatarUrl ? (
            <Image
              source={{ uri: `${MEDIA_URL}${item.avatarUrl}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{item.displayName || item.username}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        <View style={styles.followBadge}>
          <Text style={styles.followBadgeText}>View</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <Text style={styles.headerSubtitle}>Find people on Moon Light</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or username..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={[styles.searchBtn, !query.trim() && { opacity: 0.5 }]}
          onPress={handleSearch}
          disabled={!query.trim()}
        >
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyState}>
                <UserIcon size={48} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No users found</Text>
                <Text style={styles.emptySubtitle}>
                  Try a different name or username
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <SearchIcon size={48} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>Search for people</Text>
                <Text style={styles.emptySubtitle}>
                  Enter a name or username above to discover people on Moon Light
                </Text>
              </View>
            )
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.body2,
    color: colors.textMuted,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.body2,
    color: colors.textMuted,
    marginTop: 2,
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: layout.radius.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderBright,
  },
  searchInput: {
    flex: 1,
    ...typography.body2,
    color: colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: layout.radius.full,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  searchBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },

  userCard: {
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
  avatarRing: {
    borderRadius: 27,
    borderWidth: 2,
    borderColor: colors.primaryGlow,
    padding: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  username: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  followBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: layout.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followBadgeText: {
    ...typography.label,
    color: colors.primary,
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
