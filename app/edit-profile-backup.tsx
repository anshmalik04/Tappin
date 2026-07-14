import { getProfile, updateProfile, uploadPhoto } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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

const VIBE_TAGS = [
  'Adventurous', 'Night Owl', 'Creative', 'Social Butterfly', 'Outgoing',
  'Foodie', 'Explorer', 'Laid Back', 'Outdoorsy', 'Funny', 'Social',
  'Athletic', 'Bookworm',
];

const MUSIC_TAGS = [
  'Indie Rock', 'Jazz', 'Alternative', 'Hip Hop', 'R&B', 'Pop', 'Folk',
  'Indie', 'Classic Rock', 'House', 'Electronic', 'Country',
];

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
  is_primary: boolean;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);
  const [musicTaste, setMusicTaste] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [original, setOriginal] = useState<{
    name: string; age: string; bio: string;
    personality_tags: string[]; music_taste: string[];
  } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getProfile();
      const user = data.user;
      setName(user.name || '');
      setAge(user.age ? String(user.age) : '');
      setBio(user.bio || '');
      setIsVerified(!!user.is_verified);
      setPersonalityTags(user.personality_tags || []);
      setMusicTaste(user.music_taste || []);
      setPhotos(data.photos || []);
      setOriginal({
        name: user.name || '',
        age: user.age ? String(user.age) : '',
        bio: user.bio || '',
        personality_tags: user.personality_tags || [],
        music_taste: user.music_taste || [],
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      Alert.alert('Error', 'Could not load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function toggleTag(list: string[], setList: (v: string[]) => void, tag: string) {
    if (list.includes(tag)) {
      setList(list.filter((t) => t !== tag));
    } else {
      setList([...list, tag]);
    }
  }

  async function handleSave() {
    if (!original) return;

    const updates: Record<string, any> = {};
    if (name !== original.name) updates.name = name;
    if (age !== original.age) updates.age = age ? parseInt(age, 10) : null;
    if (bio !== original.bio) updates.bio = bio;
    if (JSON.stringify(personalityTags) !== JSON.stringify(original.personality_tags)) {
      updates.personality_tags = personalityTags;
    }
    if (JSON.stringify(musicTaste) !== JSON.stringify(original.music_taste)) {
      updates.music_taste = musicTaste;
    }

    if (Object.keys(updates).length === 0) {
      router.back();
      return;
    }

    try {
      setSaving(true);
      await updateProfile(updates);
      router.back();
    } catch (err) {
      console.error('Failed to update profile:', err);
      Alert.alert('Error', 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const contentType = asset.mimeType || 'image/jpeg';
    const orderIndex = photos.length;
    const isPrimary = photos.length === 0;

    try {
      setUploadingPhoto(true);

      const { upload_url, photo_id } = await uploadPhoto(orderIndex, isPrimary, contentType);

      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();

      await fetch(upload_url, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': contentType },
      });

      setPhotos([
        ...photos,
        { id: photo_id, photo_url: asset.uri, order_index: orderIndex, is_primary: isPrimary },
      ]);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      Alert.alert('Error', 'Could not upload that photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.headerButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.headerButton, styles.saveButton]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.photoGrid}>
          {photos
            .sort((a, b) => a.order_index - b.order_index)
            .map((photo) => (
              <View key={photo.id} style={styles.photoTile}>
                <Image source={{ uri: photo.photo_url }} style={styles.photoImage} />
                {photo.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
              </View>
            ))}
          {photos.length < 6 && (
            <TouchableOpacity
              style={[styles.photoTile, styles.addPhotoTile]}
              onPress={handleAddPhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? <ActivityIndicator color="#888" /> : <Text style={styles.addPhotoText}>+</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#666" />
            </View>
            <View style={{ width: 80, marginLeft: 12 }}>
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Age" placeholderTextColor="#666" keyboardType="number-pad" maxLength={2} />
            </View>
          </View>

          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ VERIFIED</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people about yourself"
            placeholderTextColor="#666"
            multiline
            maxLength={300}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Vibe</Text>
          <View style={styles.chipContainer}>
            {VIBE_TAGS.map((tag) => {
              const selected = personalityTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleTag(personalityTags, setPersonalityTags, tag)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Music</Text>
          <View style={styles.chipContainer}>
            {MUSIC_TAGS.map((tag) => {
              const selected = musicTaste.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleTag(musicTaste, setMusicTaste, tag)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  headerButton: { color: '#fff', fontSize: 16 },
  saveButton: { fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 8 },
  photoTile: { width: '30%', aspectRatio: 1, margin: '1.66%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#1c1c1e' },
  photoImage: { width: '100%', height: '100%' },
  primaryBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  primaryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  addPhotoTile: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' },
  addPhotoText: { color: '#888', fontSize: 28 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  row: { flexDirection: 'row' },
  label: { color: '#999', fontSize: 13, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1c1c1e', color: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },
  verifiedBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(52, 199, 89, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 12 },
  verifiedText: { color: '#34C759', fontSize: 12, fontWeight: '700' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#333' },
  chipSelected: { backgroundColor: '#fff', borderColor: '#fff' },
  chipText: { color: '#ccc', fontSize: 14 },
  chipTextSelected: { color: '#000', fontWeight: '600' },
});