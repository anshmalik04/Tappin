import { Colors } from '@/constants/Colors';
import { getProfile, updateProfile } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [musicTags, setMusicTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    getProfile()
      .then((data: any) => {
        const u = data?.user || {};
        setName(u.name || '');
        setAge(u.age ? String(u.age) : '');
        setBio(u.bio || '');
        setLocation(u.location || u.neighborhood || '');
        setVibeTags(parseTagField(u.personality_tags));
        setMusicTags(parseTagField(u.music_taste));
        setPhotos(data?.photos || []);
      })
      .catch((e: any) => console.error('Failed to load profile:', e))
      .finally(() => setLoading(false));
  }, []);

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

  const toggleTag = (tag: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(tag)) {
      setList(list.filter((t) => t !== tag));
    } else {
      setList([...list, tag]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ageNum = parseInt(age, 10);
      await updateProfile({
        name: name.trim(),
        age: isNaN(ageNum) ? undefined : ageNum,
        bio: bio.trim(),
        location: location.trim(),
        personality_tags: vibeTags,
        music_taste: musicTags,
      });
      router.back();
    } catch (e: any) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
    }
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.headerSave}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHOTOS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {photos.map((p) => (
              <View key={p.id} style={styles.photoTile}>
                <LinearGradient colors={['#B5CDEE', '#7FAADF']} style={StyleSheet.absoluteFill} />
                {p.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addPhotoTile}
              onPress={() => console.log('Add photo tapped')}
            >
              <Text style={styles.addPhotoPlus}>+</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Age */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AGE</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={(t) => setAge(t.replace(/\D/g, '').slice(0, 2))}
            placeholder="Your age"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Your neighborhood</Text>
              <Text style={styles.locationSubtitle}>Only your neighborhood name will appear on your profile</Text>
            </View>
          </View>
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Center City, Old City, Fishtown..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
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
  headerCancel: { fontSize: 16, color: Colors.textMuted },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  headerSave: { fontSize: 16, fontWeight: '700', color: Colors.primary },
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  locationIcon: { fontSize: 20 },
  locationInfo: { flex: 1 },
  locationTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  locationSubtitle: { fontSize: 12, color: Colors.primary, opacity: 0.7, marginTop: 3, lineHeight: 17 },
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
});