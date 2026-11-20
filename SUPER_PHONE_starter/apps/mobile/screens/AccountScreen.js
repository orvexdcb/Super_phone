import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/constants';
import AuthScreen from './AuthScreen';
import { tr } from '../lib/i18n';

export default function AccountScreen({ onNavigate, lang = 'ar' }) {
  const t = (key) => tr(lang, key);
  const { user } = useAuth();
  if (!user) return <AuthScreen lang={lang} />;
  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>{t('account')}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Pressable style={styles.primary} onPress={() => onNavigate({ name: 'new' })}>
        <Text style={styles.primaryText}>+ {t('post')}</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={() => onNavigate({ name: 'mine' })}>
        <Text style={styles.secondaryText}>{t('myListings')}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.btnText}>{t('logout')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  primary: { alignSelf: 'stretch', backgroundColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: COLORS.bg, fontWeight: '700', fontSize: 16 },
  secondary: { alignSelf: 'stretch', borderWidth: 1, borderColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
  secondaryText: { color: COLORS.gold, fontWeight: '700', fontSize: 16 },
  wrap: { padding: 24, gap: 12, alignItems: 'center' },
  h1: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  email: { color: COLORS.muted },
  btn: { borderWidth: 1, borderColor: COLORS.danger, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12 },
  btnText: { color: COLORS.danger, fontWeight: '700' },
});
