import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient, { MEDIA_URL, API_URL } from '../../api/client';
import { colors, typography, layout } from '../../theme/theme';
import { io, Socket } from 'socket.io-client';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  X,
  Send,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { username: string; displayName?: string; avatarUrl?: string };
}

function Avatar({ user, size = 42 }: { user: any; size?: number }) {
  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.[0]?.toUpperCase() || '?';

  if (user?.avatarUrl) {
    return (
      <Image
        source={{ uri: `${MEDIA_URL}${user.avatarUrl}` }}
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 1.5, borderColor: colors.primaryGlow,
        }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.primary,
    }}>
      <Text style={{ color: colors.primary, fontSize: size * 0.36, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}

function CommentsModal({
  postId,
  visible,
  onClose,
}: {
  postId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible || !postId) return;
    setLoading(true);
    apiClient.get(`/comments/${postId}`)
      .then(r => setComments(r.data?.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, postId]);

  const sendComment = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await apiClient.post(`/comments/${postId}`, { content: text.trim() });
      setComments(prev => [res.data, ...prev]);
      setText('');
    } catch {}
    finally { setSending(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentsSheet}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={c => c.id}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                ListEmptyComponent={
                  <View style={styles.commentsEmpty}>
                    <MessageCircle size={40} color={colors.textMuted} strokeWidth={1.5} />
                    <Text style={styles.commentsEmptyText}>No comments yet</Text>
                    <Text style={styles.commentsEmptySubtext}>Be the first to comment</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <Avatar user={item.author} size={34} />
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>
                        {item.author?.displayName || item.author?.username}
                      </Text>
                      <Text style={styles.commentText}>{item.content}</Text>
                      <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Input */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
                onPress={sendComment}
                disabled={!text.trim() || sending}
              >
                {sending
                  ? <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  : <Send size={18} color={colors.textOnPrimary} />
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PostCard({ item, onLikeUpdate }: { item: any; onLikeUpdate?: (id: string, liked: boolean, count: number) => void }) {
  const [liked, setLiked] = useState(item.hasLiked || false);
  const [likeCount, setLikeCount] = useState(item._count?.likes || 0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const navigation = useNavigation<any>();

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    const nextCount = next ? likeCount + 1 : likeCount - 1;
    setLikeCount(nextCount);
    onLikeUpdate?.(item.id, next, nextCount);
    try {
      await apiClient.post(`/likes/${item.id}`);
    } catch {
      setLiked(!next);
      setLikeCount(likeCount);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.author?.displayName || item.author?.username} on Moon Light: "${item.content || ''}"`,
        title: 'Moon Light',
      });
    } catch {}
  };

  const commentCount = item._count?.comments || 0;

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <TouchableOpacity
        style={styles.postHeader}
        onPress={() => navigation.navigate('Profile', { username: item.author?.username })}
        activeOpacity={0.75}
      >
        <Avatar user={item.author} size={44} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>
            {item.author?.displayName || item.author?.username || 'Unknown'}
          </Text>
          <Text style={styles.authorMeta}>
            @{item.author?.username || 'unknown'}
            {item.createdAt ? `  ·  ${timeAgo(item.createdAt)}` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MoreHorizontal size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>

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

      {/* Stats row */}
      {(likeCount > 0 || commentCount > 0) && (
        <View style={styles.statsRow}>
          {likeCount > 0 && (
            <View style={styles.statChip}>
              <Heart size={12} color={colors.like} fill={colors.like} />
              <Text style={styles.statChipText}>{likeCount}</Text>
            </View>
          )}
          {commentCount > 0 && (
            <Text style={styles.statChipText}>
              {commentCount} comment{commentCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Heart
            size={22}
            color={liked ? colors.like : colors.textSecondary}
            fill={liked ? colors.like : 'transparent'}
          />
          <Text style={[styles.actionLabel, liked && { color: colors.like }]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)} activeOpacity={0.7}>
          <MessageCircle size={22} color={colors.textSecondary} />
          <Text style={styles.actionLabel}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
          <Share2 size={22} color={colors.textSecondary} />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setSaved(!saved)} activeOpacity={0.7}>
          <Bookmark
            size={22}
            color={saved ? colors.primary : colors.textSecondary}
            fill={saved ? colors.primary : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <CommentsModal
        postId={item.id}
        visible={showComments}
        onClose={() => setShowComments(false)}
      />
    </View>
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await apiClient.get('/posts/feed');
      setPosts(res.data);
    } catch (e) {
      console.error('Failed to fetch posts', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    const baseUrl = API_URL.replace('/api', '');
    const socket = io(baseUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;
    socket.on('connect', () => console.log('WS connected'));
    socket.on('disconnect', r => console.log('WS disconnected', r));
    socket.on('connect_error', e => console.error('WS error', e));
    socket.on('new_post', (newPost: any) => {
      setPosts(prev => [newPost, ...prev]);
    });
    return () => { socket.disconnect(); };
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleLikeUpdate = (id: string, liked: boolean, count: number) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, hasLiked: liked, _count: { ...p._count, likes: count } } : p
    ));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText]}>Loading your feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>Moon Light</Text>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard item={item} onLikeUpdate={handleLikeUpdate} />
        )}
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
            <Sparkles size={52} color={colors.primary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Your feed is empty</Text>
            <Text style={styles.emptySubtitle}>
              Follow people or create your first post to light up your feed
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
    gap: 12,
  },
  loadingText: {
    ...typography.body2,
    color: colors.textMuted,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },

  listContent: {
    paddingTop: 6,
    paddingBottom: 32,
  },

  // Post card
  postCard: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  authorMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  moreBtn: {
    padding: 4,
  },

  // Content
  postContent: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingBottom: 12,
    lineHeight: 23,
  },

  // Image
  postImage: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    backgroundColor: colors.surfaceElevated,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChipText: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 10,
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Comments Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  commentsSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
    borderTopWidth: 1,
    borderColor: colors.borderBright,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderBright,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentsTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  commentsEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  commentsEmptyText: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  commentsEmptySubtext: {
    ...typography.body2,
    color: colors.textMuted,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentAuthor: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  commentText: {
    ...typography.body2,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  commentTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.textPrimary,
    ...typography.body2,
    borderWidth: 1,
    borderColor: colors.borderBright,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
