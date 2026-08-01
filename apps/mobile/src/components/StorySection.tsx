import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, layout, typography } from '../theme/theme';
import { User } from '../types/api';

interface StorySectionProps {
  users: User[];
  currentUser?: User;
}

export const StorySection = ({ users, currentUser }: StorySectionProps) => {
  // Deduplicate users
  const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current User Add Story */}
        <Pressable style={styles.storyItem}>
          <View style={styles.myStoryContainer}>
            <Image 
              source={{ uri: currentUser?.avatarUrl || 'https://via.placeholder.com/150' }} 
              style={styles.storyImage} 
            />
            <View style={styles.addIconContainer}>
              <Plus size={12} color={colors.textOnPrimary} strokeWidth={3} />
            </View>
          </View>
          <Text style={styles.storyName} numberOfLines={1}>Your Story</Text>
        </Pressable>

        {/* Other Users */}
        {uniqueUsers.map(user => {
          if (user.id === currentUser?.id) return null;
          return (
            <Pressable key={user.id} style={styles.storyItem}>
              <View style={styles.storyRing}>
                <Image 
                  source={{ uri: user.avatarUrl || 'https://via.placeholder.com/150' }} 
                  style={styles.storyImage} 
                />
              </View>
              <Text style={styles.storyName} numberOfLines={1}>
                {user.username}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: layout.spacing.md,
    gap: layout.spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myStoryContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderBright,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  storyName: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 6,
  },
});
