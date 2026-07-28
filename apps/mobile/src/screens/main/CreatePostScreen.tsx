import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/client';
import { colors, layout } from '../../theme/theme';
import { ImagePlus, X, Wand2 } from 'lucide-react-native';

export default function CreatePostScreen({ navigation }: any) {
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleGenerateCaption = async () => {
    if (!content.trim()) {
      Alert.alert('Needs Context', 'Please type a few words about your post so the AI knows what to write about!');
      return;
    }
    setGeneratingAI(true);
    try {
      const response = await apiClient.post('/ai/generate-caption', { prompt: content });
      if (response.data.caption) setContent(response.data.caption);
    } catch (error: any) {
      console.error('AI Generation Failed:', error);
      Alert.alert('AI Error', 'Could not generate caption. Ensure LM Studio is running on port 1234.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !imageUri) {
      Alert.alert('Empty Post', 'Please add some text or an image.');
      return;
    }
    setLoading(true);
    try {
      let mediaUrls: string[] = [];
      if (imageUri) {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('file', { uri: imageUri, name: filename, type } as any);
        const uploadRes = await apiClient.post('/media/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mediaUrls.push(uploadRes.data.url);
      }
      await apiClient.post('/posts', { content: content.trim(), mediaUrls });
      setContent('');
      setImageUri(null);
      navigation.navigate('Feed');
    } catch (error: any) {
      console.error('Post creation failed', error.response?.data || error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postButton, (!content.trim() && !imageUri) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {/* Text Input */}
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textMuted}
          multiline
          autoFocus
          value={content}
          onChangeText={setContent}
        />

        {/* AI Caption Button */}
        <View style={styles.aiRow}>
          <TouchableOpacity
            style={[styles.aiButton, generatingAI && styles.aiButtonDisabled]}
            onPress={handleGenerateCaption}
            disabled={generatingAI}
          >
            {generatingAI ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Wand2 color={colors.primary} size={15} />
                <Text style={styles.aiButtonText}>✨ AI Magic Caption</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Image Preview or Add Photo */}
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <X color="#fff" size={18} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
            <View style={styles.addImageInner}>
              <ImagePlus color={colors.primary} size={26} />
              <Text style={styles.addImageTitle}>Add a photo</Text>
              <Text style={styles.addImageSub}>Tap to choose from your gallery</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtn: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  postButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: layout.radius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: colors.placeholder,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  input: {
    fontSize: 17,
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    minHeight: 130,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  aiRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: layout.radius.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  aiButtonDisabled: {
    opacity: 0.5,
  },
  aiButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  addImageButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: layout.radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  addImageInner: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.background,
  },
  addImageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 12,
  },
  addImageSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  imageContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: layout.radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 320,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
