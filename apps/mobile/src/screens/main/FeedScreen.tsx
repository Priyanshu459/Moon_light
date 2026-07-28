import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import apiClient, { MEDIA_URL, API_URL } from '../../api/client';
import { colors, typography, layout } from '../../theme/theme';
import { io } from 'socket.io-client';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function PostCard({ item }: { item: any }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = item.author?.displayName
    ? item.author.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : item.author?.username?.[0]?.toUpperCase() || '?';

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.avatarWrapper}>
          {item.author?.avatarUrl ? (
            <Image
              source={{ uri: `${MEDIA_URL}${item.author.avatarUrl}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>
            {item.author?.displayName || item.author?.username || 'Unknown User'}
          </Text>
          <Text style={styles.authorMeta}>
            @{item.author?.username || 'unknown'}
            {item.createdAt ? `  ·  ${timeAgo(item.createdAt)}` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreButtonText}>···</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {item.content ? (
        <Text style={styles.postContent}>{item.content}</Text>
      ) : null}

      {/* Image */}
      {item.media && item.media.length > 0 && (
        <Image
          source={{ uri: `${MEDIA_URL}${item.media[0].url}` }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setLiked(!liked)}
        >
          <Heart
            size={20}
            color={liked ? colors.error : colors.textSecondary}
            fill={liked ? colors.error : 'transparent'}
          />
          <Text style={[styles.actionLabel, liked && { color: colors.error }]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <MessageCircle size={20} color={colors.textSecondary} />
          <Text style={styles.actionLabel}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Share2 size={20} color={colors.textSecondary} />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setSaved(!saved)}
        >
          <Bookmark
            size={20}
            color={saved ? colors.primary : colors.textSecondary}
            fill={saved ? colors.primary : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get('/posts/feed');
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const baseUrl = API_URL.replace('/api', '');
    const socket = io(baseUrl, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('Connected to WebSocket'));
    socket.on('new_post', (newPost: any) => {
      console.log('Received new post via WebSocket:', newPost.id);
      setPosts((prev) => [newPost, ...prev]);
    });

    return () => { socket.disconnect(); };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌙</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to share something with Moon Light!
            </Text>
          </View>
        }
      />
    </View>
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
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Post Card
  postCard: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Header
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  avatarWrapper: {
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  authorMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 1,
  },
  moreButton: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  moreButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
    letterSpacing: 1,
    lineHeight: 20,
  },

  // Content
  postContent: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  // Image
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: colors.placeholder,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 16,
    marginTop: 2,
  },

  // Actions
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
