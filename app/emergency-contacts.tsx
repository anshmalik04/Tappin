import { Colors } from '@/constants/Colors';
import { createEmergencyContact, deleteEmergencyContact, getEmergencyContacts } from '@/services/api';
import * as Contacts from 'expo-contacts/legacy';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  phone_number?: string;
}

const formatPhone = (text: string) => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length >= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length >= 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }
  return cleaned;
};

export default function EmergencyContactsScreen() {
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  useEffect(() => {
    getEmergencyContacts()
      .then((data: any) => setContacts(data?.contacts || []))
      .catch((e: any) => console.error('Failed to load contacts:', e))
      .finally(() => setLoading(false));
  }, []);

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setNewName(contact.name);
    setNewPhone(contact.phone || contact.phone_number || '');
    setShowModal(true);
  };

  const handleAddContact = async () => {
    setEditingContact(null);
    setNewName('');
    setNewPhone('');

    const { status } = await Contacts.requestPermissionsAsync();

    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      const contactsWithPhone = data
        .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0 && c.name)
        .slice(0, 50)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      if (contactsWithPhone.length > 0) {
        const buttons = contactsWithPhone.map((c) => ({
          text: `${c.name} — ${c.phoneNumbers![0].number}`,
          onPress: () => {
            setNewName(c.name || '');
            setNewPhone(formatPhone(c.phoneNumbers![0].number || ''));
            setShowModal(true);
          },
        }));
        buttons.push({ text: 'Add manually instead', onPress: () => setShowModal(true) });
        buttons.push({ text: 'Cancel', onPress: () => {} });
        Alert.alert('Choose a contact', '', buttons);
        return;
      }
    }

    // Permission denied or no contacts — go straight to manual entry
    setShowModal(true);
  };

  const saveContact = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setSaving(true);
    try {
      if (editingContact) {
        await deleteEmergencyContact(editingContact.id);
        setContacts((prev) => prev.filter((c) => c.id !== editingContact.id));
      }

      const result = await createEmergencyContact(newName.trim(), newPhone.trim());
      const saved = result?.contact || result;
      setContacts((prev) => [...prev, saved]);
      setNewName('');
      setNewPhone('');
      setEditingContact(null);
      setShowModal(false);
    } catch (e) {
      console.error('Failed to save contact:', e);
    } finally {
      setSaving(false);
    }
  };

  const removeContact = async (id: string) => {
    Alert.alert('Remove Contact', 'Are you sure you want to remove this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEmergencyContact(id);
            setContacts((prev) => prev.filter((c) => c.id !== id));
          } catch (e) {
            console.error('Failed to remove contact:', e);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.explainerBox}>
          <Text style={styles.explainerText}>
            🛡 These people receive a text when you share a meetup spot in chat. Add up to 3 contacts.
          </Text>
        </View>

        {contacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={styles.contactRow}
            onPress={() => openEditModal(contact)}
            activeOpacity={0.7}
          >
            <View style={styles.contactAvatar}>
              <Text style={styles.contactAvatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone || contact.phone_number}</Text>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal(contact)}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  removeContact(contact.id);
                }}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {contacts.length < 3 && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAddContact}>
            <Text style={styles.addBtnText}>+ Add contact</Text>
          </TouchableOpacity>
        )}

        {contacts.length === 3 && (
          <Text style={styles.maxText}>Maximum of 3 contacts reached.</Text>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Edit contact' : 'Add emergency contact'}
            </Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mom, Best Friend"
              placeholderTextColor={Colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={styles.inputLabel}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="(215) 555-0100"
              placeholderTextColor={Colors.textMuted}
              value={newPhone}
              onChangeText={(text) => setNewPhone(formatPhone(text))}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveContact} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editingContact ? 'Save changes' : 'Save contact'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowModal(false);
                setEditingContact(null);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: { fontSize: 24, color: Colors.primary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: 20 },
  explainerBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  explainerText: { fontSize: 14, color: Colors.primary, lineHeight: 20 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactAvatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  contactPhone: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  contactActions: { flexDirection: 'row', gap: 8 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  editBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  removeBtnText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  addBtn: {
    marginTop: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  maxText: { marginTop: 20, textAlign: 'center', color: Colors.textMuted, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    marginBottom: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
});