import { Colors } from '@/constants/Colors';
import { getProfile, updateProfile, uploadPhoto } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VIBE_OPTIONS = [
  'Adventurous', 'Night Owl', 'Creative', 'Social Butterfly', 'Outgoing',
  'Foodie', 'Explorer', 'Laid Back', 'Outdoorsy', 'Funny', 'Social', 'Athletic', 'Bookworm',
];

const MUSIC_OPTIONS = [
  'Indie Rock', 'Jazz', 'Alternative', 'Hip Hop', 'R&B', 'Pop',
  'Folk', 'Indie', 'Classic Rock', 'House', 'Electronic', 'Country',
];

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
  is_primary: boolean;
}

const parseTagField = (field: any): string[] => {
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [bio, setBio] = useState('');
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [musicTags, setMusicTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const loadProfile = async () => {
    try {
      const data: any = await getProfile();
      const u = data?.user || {};
      setBio(u.bio || '');
      setVibeTags(parseTagField(u.personality_tags));
      setMusicTags(parseTagField(u.music_taste));
      setPhotos(data?.photos || []);
    } catch (e: any) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const toggleTag = (tag: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(tag)) {
      setList(list.filter((t) => t !== tag));
    } else {
      setList([...list, tag]);
    }
  };

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow photo access in Settings to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const pickedImage = result.assets[0];
    setUploading(true);

    try {
      const orderIndex = photos.length;
      const isPrimary = photos.length === 0;
      const { upload_url, photo_id } = await uploadPhoto(orderIndex, isPrimary, 'image/jpeg');

      const imageResponse = await fetch(pickedImage.uri);
      const blob = await imageResponse.blob();
      await fetch(upload_url, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      await loadProfile();
    } catch (e: any) {
      console.error('Photo upload failed:', e);
      Alert.alert('Upload Failed', e?.message || 'Something went wrong uploading your photo.');
    } finally {
      setUploading(false);
    }
  };

  // Save whatever the user has filled in, then head to the map.
  const finish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        bio: bio.trim(),
        personality_tags: vibeTags,
        music_taste: musicTags,
      });
    } catch (e: any) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
      // Go to the map regardless — profile can be finished later from My Profile.
      router.replace('/(tabs)' as any);
    }
  };

  const skip = () => {
    router.replace('/(tabs)' as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <TouchableOpacity onPress={skip}>
          <Text style={styles.headerSkip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Add a few details so people can get to know you. You can always finish this later.
        </Text>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHOTOS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {photos.map((p) => (
              <View key={p.id} style={styles.photoTile}>
                {p.photo_url ? (
                  <Image source={{ uri: p.photo_url }} style={StyleSheet.absoluteFill} />
                ) : (
                  <LinearGradient colors={['#B5CDEE', '#7FAADF']} style={StyleSheet.absoluteFill} />
                )}
                {p.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addPhotoTile} onPress={handleAddPhoto} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.addPhotoPlus}>+</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BIO</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people a bit about yourself..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={200}
          />
        </View>

        {/* Vibe tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VIBE</Text>
          <View style={styles.chipRow}>
            {VIBE_OPTIONS.map((tag) => {
              const active = vibeTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleTag(tag, vibeTags, setVibeTags)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Music tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MUSIC</Text>
          <View style={styles.chipRow}>
            {MUSIC_OPTIONS.map((tag) => {
              const active = musicTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.chip, active && styles.chipActiveMusic]}
                  onPress={() => toggleTag(tag, musicTags, setMusicTags)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActiveMusic]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.continueBtn} onPress={finish} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.continueBtnText}>Continue to map</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  headerSkip: { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: 16,
    lineHeight: 20,
  },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  photoRow: { gap: 10, paddingRight: 20 },
  photoTile: { width: 90, height: 90, borderRadius: 14, overflow: 'hidden' },
  primaryBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  addPhotoTile: {
    width: 90,
    height: 90,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoPlus: { fontSize: 32, color: Colors.primary, fontWeight: '300' },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipActiveMusic: { backgroundColor: Colors.successLight, borderColor: Colors.success },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  chipTextActiveMusic: { color: Colors.success },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});