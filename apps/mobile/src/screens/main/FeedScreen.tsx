import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient, { API_URL } from '../../api/client';
import { colors, typography, layout } from '../../theme/theme';
import { io, Socket } from 'socket.io-client';
import { Bell, Search, Sparkles } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { PostCard } from '../../components/PostCard';
import { StorySection } from '../../components/StorySection';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { CommentBottomSheet } from '../../components/CommentBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAuth } from '../../context/AuthContext';
import { Post, User } from '../../types/api';

export default function FeedScreen() {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  // Bottom Sheet state
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<any[]>([]);

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

  const handleLikeUpdate = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        const nextLiked = !p.hasLiked;
        const currentLikes = p._count?.likes || 0;
        return {
          ...p,
          hasLiked: nextLiked,
          _count: { ...p._count, likes: nextLiked ? currentLikes + 1 : currentLikes - 1 }
        } as Post;
      }
      return p;
    }));

    // Optimistic API Call
    apiClient.post(`/likes/${id}`).catch(() => {
      // Rollback on failure could be implemented here
    });
  };

  const handleOpenComments = async (postId: string) => {
    setActivePostId(postId);
    bottomSheetModalRef.current?.present();
    
    // Fetch comments for this post
    try {
      const r = await apiClient.get(`/comments/${postId}`);
      setActiveComments(r.data?.data || r.data || []);
    } catch (e) {
      console.error('Failed to fetch comments', e);
    }
  };

  const handleSendComment = async (text: string) => {
    if (!activePostId || !text.trim()) return;
    try {
      const res = await apiClient.post(`/comments/${activePostId}`, { content: text.trim() });
      setActiveComments(prev => [res.data, ...prev]);
      
      // Update post comment count
      setPosts(prev => prev.map(p => 
        p.id === activePostId 
          ? { ...p, _count: { ...p._count, comments: (p._count?.comments || 0) + 1 } } as Post
          : p
      ));
    } catch (e) {
      console.error('Failed to post comment', e);
    }
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <SkeletonLoader width={36} height={36} borderRadius={18} />
            <SkeletonLoader width={120} height={14} style={{ marginLeft: 12 }} />
          </View>
          <SkeletonLoader width="100%" height={400} />
          <View style={styles.skeletonActions}>
            <SkeletonLoader width={26} height={26} borderRadius={13} style={{ marginRight: 16 }} />
            <SkeletonLoader width={26} height={26} borderRadius={13} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top App Bar */}
      <View style={styles.appBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Moon Light</Text>
        </View>
        <View style={styles.appBarActions}>
          <Pressable style={styles.iconBtn}>
            <Search size={24} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Bell size={24} color={colors.textPrimary} />
            <View style={styles.notificationBadge} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <StorySection 
              users={posts.map(p => p.author as User)} 
              currentUser={currentUser as User} 
            />
          }
          renderItem={({ item }) => (
            <PostCard 
              post={item} 
              onLikePress={handleLikeUpdate} 
              onCommentPress={handleOpenComments} 
            />
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
      )}

      {/* Comment Bottom Sheet */}
      <CommentBottomSheet 
        ref={bottomSheetModalRef} 
        postId={activePostId || ''} 
        comments={activeComments} 
        onSendComment={handleSendComment} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    backgroundColor: colors.background,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: layout.spacing.xs,
    marginLeft: layout.spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.background,
  },
  listContent: {
    paddingBottom: 100, // Make room for floating nav bar
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonCard: {
    marginBottom: layout.spacing.lg,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.md,
  },
  skeletonActions: {
    flexDirection: 'row',
    padding: layout.spacing.md,
  },
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
});
