import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, FlatList, Image } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { colors, layout, typography } from '../theme/theme';
import { Send, Smile, Image as ImageIcon, Mic } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  user: {
    username: string;
    avatarUrl: string | null;
  };
  content: string;
  createdAt: string;
}

interface CommentBottomSheetProps {
  postId: string;
  comments: Comment[]; // Mock or real comments passed from parent
  onSendComment: (text: string) => void;
}

export const CommentBottomSheet = forwardRef<BottomSheetModal, CommentBottomSheetProps>(({ postId, comments, onSendComment }, ref) => {
  const snapPoints = useMemo(() => ['60%', '90%'], []);
  const [inputText, setInputText] = React.useState('');

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  const handleSend = () => {
    if (inputText.trim()) {
      onSendComment(inputText.trim());
      setInputText('');
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentRow}>
      <Image source={{ uri: item.user.avatarUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>{item.user.username}</Text>
          <Text style={styles.time}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Comments</Text>
        
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
            </View>
          }
        />

        <View style={styles.inputSection}>
          <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.inputAvatar} />
          <View style={styles.inputWrapper}>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <View style={styles.inputActions}>
              <Pressable style={styles.iconButton}>
                <Smile size={20} color={colors.textSecondary} />
              </Pressable>
              <Pressable style={styles.iconButton}>
                <ImageIcon size={20} color={colors.textSecondary} />
              </Pressable>
              <Pressable style={styles.iconButton}>
                <Mic size={20} color={colors.textSecondary} />
              </Pressable>
              <Pressable 
                onPress={handleSend} 
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              >
                <Send size={20} color={inputText.trim() ? colors.primary : colors.textMuted} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.surface,
  },
  handleIndicator: {
    backgroundColor: colors.borderBright,
    width: 40,
  },
  container: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContainer: {
    padding: layout.spacing.md,
    paddingBottom: layout.spacing.xxl * 3,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: layout.spacing.lg,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: layout.spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: layout.spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  commentText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  inputSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: layout.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? layout.spacing.xl : layout.spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: layout.spacing.sm,
    marginBottom: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: layout.radius.md,
    paddingHorizontal: layout.spacing.sm,
    paddingTop: Platform.OS === 'ios' ? layout.spacing.sm : 0,
    paddingBottom: layout.spacing.xs,
    minHeight: 40,
    maxHeight: 120,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 32,
    maxHeight: 80,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  iconButton: {
    padding: 6,
    marginLeft: 4,
  },
  sendButton: {
    padding: 6,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    padding: layout.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
