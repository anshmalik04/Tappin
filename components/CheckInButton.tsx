import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useCheckIn } from '@/context/CheckInContext';
import { Colors } from '@/constants/Colors';

interface CheckInButtonProps {
  venueId: string;
  style?: object;
}

export default function CheckInButton({ venueId, style }: CheckInButtonProps) {
  const { isCheckedIn, toggleCheckIn, canCheckIn, checkInCount } = useCheckIn();
  const checkedIn = isCheckedIn(venueId);
  const maxReached = !canCheckIn && !checkedIn;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        checkedIn && styles.checkedIn,
        maxReached && styles.disabled,
        style,
      ]}
      onPress={() => toggleCheckIn(venueId)}
      disabled={maxReached}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, checkedIn && styles.checkedInText, maxReached && styles.disabledText]}>
        {checkedIn ? '✓ Checked In' : maxReached ? 'Max 3 Check-Ins Reached' : '📍 Check In Here'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedIn: {
    backgroundColor: Colors.success,
  },
  disabled: {
    backgroundColor: Colors.border,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  checkedInText: {
    color: Colors.white,
  },
  disabledText: {
    color: Colors.textMuted,
  },
});
