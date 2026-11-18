import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '../lib/constants';

export default function Chip({ label, on, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.on]}>
      <Text style={[styles.text, on && styles.textOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border },
  on: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  text: { color: COLORS.text },
  textOn: { color: COLORS.bg, fontWeight: '700' },
});
