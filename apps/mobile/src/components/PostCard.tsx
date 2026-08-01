import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Post } from '../types/api';
import { colors, layout, typography } from '../theme/theme';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLikePress: (postId: string) => void;
  onCommentPress: (postId: string) => void;
}

const AnimatedHeart = Animated.createAnimatedComponent(Heart);

export const PostCard = ({ post, onLikePress, onCommentPress }: PostCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Like animation state
  const scale = useSharedValue(0);
  const likeButtonScale = useSharedValue(1);

  const triggerLikeAnimation = useCallback(() => {
    'worklet';
    scale.value = withSequence(
      withSpring(1, { damping: 10, stiffness: 100 }),
      withSpring(0, { damping: 15, stiffness: 150 })
    );
    likeButtonScale.value = withSequence(
      withSpring(1.4, { damping: 10 }),
      withSpring(1)
    );
    if (!post.hasLiked) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      runOnJS(onLikePress)(post.id);
    }
  }, [post.hasLiked, post.id, onLikePress]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onStart(() => {
      triggerLikeAnimation();
    });

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(scale.value, 0) }],
    opacity: scale.value,
  }));

  const animatedLikeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeButtonScale.value }],
  }));

  const handleLikeButton = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeButtonScale.value = withSequence(
      withSpring(1.4, { damping: 10 }),
      withSpring(1)
    );
    onLikePress(post.id);
  };

  const imageUri = post.media?.[0]?.url;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: post.author.avatarUrl || 'https://via.placeholder.com/150' }} 
          style={styles.avatar} 
        />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{post.author.displayName || post.author.username}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </View>

      {/* Media with Double Tap Gesture */}
      {imageUri && (
        <GestureDetector gesture={doubleTap}>
          <View style={styles.mediaContainer}>
            <Image source={{ uri: imageUri }} style={styles.media} />
            <Animated.View style={[styles.bigHeartContainer, animatedHeartStyle]} pointerEvents="none">
              <Heart size={80} color={colors.like} fill={colors.like} />
            </Animated.View>
          </View>
        </GestureDetector>
      )}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionGroup}>
          <Pressable onPress={handleLikeButton}>
            <Animated.View style={animatedLikeButtonStyle}>
              <AnimatedHeart 
                size={26} 
                color={post.hasLiked ? colors.like : colors.textPrimary} 
                fill={post.hasLiked ? colors.like : 'transparent'} 
              />
            </Animated.View>
          </Pressable>
          <Pressable onPress={() => onCommentPress(post.id)} style={styles.actionButton}>
            <MessageCircle size={26} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Send size={26} color={colors.textPrimary} />
          </Pressable>
        </View>
        <Pressable>
          <Bookmark size={26} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Content & Likes */}
      <View style={styles.contentContainer}>
        <Text style={styles.likesText}>
          {(post._count?.likes || 0).toLocaleString()} likes
        </Text>
        
        {post.content && (
          <Pressable onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.caption} numberOfLines={isExpanded ? undefined : 2}>
              <Text style={styles.captionAuthor}>{post.author.username} </Text>
              {post.content}
            </Text>
            {!isExpanded && post.content.length > 80 && (
              <Text style={styles.moreText}>more</Text>
            )}
          </Pressable>
        )}

        {/* Comments Preview */}
        {(post._count?.comments || 0) > 0 && (
          <Pressable onPress={() => onCommentPress(post.id)}>
            <Text style={styles.viewCommentsText}>
              View all {post._count?.comments} comments
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    marginBottom: layout.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: layout.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mediaContainer: {
    width: width,
    height: width * 1.25, // 4:5 aspect ratio
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bigHeartContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    paddingTop: layout.spacing.sm,
    paddingBottom: layout.spacing.xs,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: layout.spacing.lg,
  },
  contentContainer: {
    paddingHorizontal: layout.spacing.md,
  },
  likesText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: layout.spacing.xs,
  },
  caption: {
    ...typography.body,
    color: colors.textPrimary,
  },
  captionAuthor: {
    fontWeight: '700',
  },
  moreText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewCommentsText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: layout.spacing.xs,
  },
});
