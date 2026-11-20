import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/constants';
import { tr } from '../lib/i18n';

export default function AuthScreen({ lang = 'ar' }) {
  const t = (key) => tr(lang, key);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function submit() {
    setError(''); setInfo('');
    if (!email.trim() || !password) return setError(t('enterCredentials'));
    if (mode === 'signup' && password.length < 8) return setError(t('passwordLength'));
    setBusy(true);
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) setError(t('loginError'));
    } else {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(), password, options: { data: { full_name: name.trim() } },
      });
      if (err) setError(t('signupError'));
      else if (!data.session) setInfo(t('confirmEmail'));
    }
    setBusy(false);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>{mode === 'login' ? t('login') : t('signup')}</Text>
      {mode === 'signup' && (
        <TextInput style={styles.input} placeholder={t('name')} value={name} onChangeText={setName} textAlign="right" maxLength={80} />
      )}
      <TextInput style={styles.input} placeholder={t('email')} value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <TextInput style={styles.input} placeholder={t('password')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.btnText}>{mode === 'login' ? t('enter') : t('createAccount')}</Text>}
      </Pressable>
      {!!error && <Text style={styles.err}>{error}</Text>}
      {!!info && <Text style={styles.ok}>{info}</Text>}
      <Pressable onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}>
        <Text style={styles.alt}>{mode === 'login' ? t('noAccount') : t('haveAccount')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, gap: 10 },
  h1: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8, color: COLORS.text },
  input: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 16, color: COLORS.text },
  btn: { backgroundColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
  btnText: { color: COLORS.bg, fontWeight: '700', fontSize: 16 },
  err: { color: COLORS.danger, textAlign: 'center' },
  ok: { color: COLORS.gold, textAlign: 'center' },
  alt: { color: COLORS.gold, textAlign: 'center', marginTop: 12 },
});
