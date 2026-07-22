import { Colors } from '@/constants/Colors';
import { REPORT_REASONS, ReportReason, reportUser } from '@/services/moderation';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  userId: string;
  userName?: string;
  // Extra context when reporting a specific message rather than a profile.
  messageId?: string;
  messagePreview?: string;
  onClose: () => void;
  // Fired after a successful submit, so the caller can also block if it wants.
  onReported?: (reason: ReportReason) => void;
}

export default function ReportModal({
  visible,
  userId,
  userName,
  messageId,
  messagePreview,
  onClose,
  onReported,
}: Props) {
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'sent' | 'queued' | null>(null);

  const reset = () => {
    setSelected(null);
    setDetails('');
    setSubmitting(false);
    setResult(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    const context = messageId ? `message:${messageId} ${messagePreview || ''}`.trim() : '';
    const body = [details.trim(), context].filter(Boolean).join(' | ');
    const ok = await reportUser(userId, selected, body);
    setSubmitting(false);
    setResult(ok ? 'sent' : 'queued');
    onReported?.(selected);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {result ? (
            <View style={styles.doneBlock}>
              <Text style={styles.doneIcon}>{'\u2713'}</Text>
              <Text style={styles.doneTitle}>Report submitted</Text>
              <Text style={styles.doneBody}>
                {result === 'sent'
                  ? 'Our team reviews reports within 24 hours. Thanks for helping keep Tappin safe.'
                  : 'Saved. This report will be sent for review as soon as the connection is restored.'}
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={close}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.handle} />
              <Text style={styles.title}>
                Report {userName ? userName : 'this user'}
              </Text>
              <Text style={styles.subtitle}>
                {messageId
                  ? 'Tell us what is wrong with this message.'
                  : 'Reports are confidential. The other person is not told.'}
              </Text>

              {messagePreview ? (
                <View style={styles.quote}>
                  <Text style={styles.quoteText} numberOfLines={2}>
                    {messagePreview}
                  </Text>
                </View>
              ) : null}

              <ScrollView style={styles.reasonList} keyboardShouldPersistTaps="handled">
                {REPORT_REASONS.map((r) => {
                  const active = selected === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[styles.reason, active && styles.reasonActive]}
                      onPress={() => setSelected(r.key)}
                    >
                      <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                        {r.label}
                      </Text>
                      {active && <Text style={styles.check}>{'\u2713'}</Text>}
                    </TouchableOpacity>
                  );
                })}

                {selected === 'other' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Tell us more (optional)"
                    placeholderTextColor={Colors.textMuted}
                    value={details}
                    onChangeText={setDetails}
                    multiline
                  />
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.primaryBtn, !selected && styles.primaryBtnDisabled]}
                onPress={submit}
                disabled={!selected || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Submit report</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={close}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 6, lineHeight: 19 },
  quote: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
  },
  quoteText: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  reasonList: { marginTop: 14, marginBottom: 8 },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  reasonActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  reasonText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  reasonTextActive: { color: Colors.primary, fontWeight: '700' },
  check: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: Colors.hot,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  doneBlock: { alignItems: 'center', paddingVertical: 20 },
  doneIcon: { fontSize: 44, color: Colors.success, marginBottom: 10 },
  doneTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  doneBody: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
});
