import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import {
  COLORS, CONDITION_LABELS, GOVERNORATES, IMAGE_EXT, MAX_IMAGES, MAX_IMAGE_BYTES,
} from '../lib/constants';
import Chip from '../components/Chip';
import { tr } from '../lib/i18n';

const SPECS = [
  ['storage', t('storage')],
  ['ram', t('ram')],
  ['battery_health', t('battery')],
  ['color', t('color')],
];

export default function NewListingScreen({ onDone, lang = 'ar' }) {
  const t = (key) => tr(lang, key);
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [f, setF] = useState({
    category_id: '', title: '', price: '', currency: 'IQD', condition: '', brand: '', model: '',
    governorate: '', city: '', contact_phone: '', description: '',
    spec_storage: '', spec_ram: '', spec_battery_health: '', spec_color: '',
  });
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.from('categories').select('id,name_ar').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCategories(data || []));
    supabase.from('profiles').select('phone,governorate').eq('id', user.id).single()
      .then(({ data }) => data && setF((p) => ({
        ...p, contact_phone: p.contact_phone || data.phone || '', governorate: p.governorate || data.governorate || '',
      })));
  }, [user.id]);

  async function pick() {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (res.canceled) return;
    const next = [];
    for (const a of res.assets) {
      const type = a.mimeType || 'image/jpeg';
      if (!IMAGE_EXT[type]) return setError(t('imageTypeError'));
      if (a.fileSize && a.fileSize > MAX_IMAGE_BYTES) return setError(t('imageSizeError'));
      next.push({ uri: a.uri, type });
    }
    setError('');
    setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
  }

  async function submit() {
    setError('');
    const price = Number(f.price);
    if (!f.category_id || !f.condition || !f.governorate) return setError(t('chooseRequired'));
    if (f.title.trim().length < 3) return setError(t('titleRequired'));
    if (!f.price || !Number.isFinite(price) || price < 0) return setError(t('priceRequired'));
    if (!f.contact_phone.trim()) return setError(t('phoneRequired'));
    if (images.length === 0) return setError(t('imageRequired'));

    setBusy(true);
    const uploaded = [];
    const cleanup = () => uploaded.length && supabase.storage.from('listing-images').remove(uploaded);

    for (const img of images) {
      try {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${IMAGE_EXT[img.type]}`;
        const buf = await (await fetch(img.uri)).arrayBuffer();
        const { error: upErr } = await supabase.storage.from('listing-images')
          .upload(path, buf, { contentType: img.type, upsert: false });
        if (upErr) throw upErr;
        uploaded.push(path);
      } catch {
        await cleanup();
        setBusy(false);
        return setError(t('uploadError'));
      }
    }

    const t = (v) => (v || '').trim();
    const { data: listing, error: insErr } = await supabase.from('listings').insert({
      seller_id: user.id, category_id: f.category_id, title: t(f.title), description: t(f.description) || null,
      price, currency: f.currency, condition: f.condition, brand: t(f.brand) || null, model: t(f.model) || null,
      governorate: f.governorate, city: t(f.city) || null, contact_phone: t(f.contact_phone), status: 'pending_review',
    }).select('id').single();

    if (insErr || !listing) {
      await cleanup();
      setBusy(false);
      return setError(t('submitError'));
    }

    const { error: imgErr } = await supabase.from('listing_images').insert(
      uploaded.map((storage_path, i) => ({ listing_id: listing.id, storage_path, sort_order: i })));
    const specRows = SPECS.map(([k]) => ({ listing_id: listing.id, spec_key: k, spec_value: t(f[`spec_${k}`]) }))
      .filter((s) => s.spec_value);
    const { error: specErr } = specRows.length
      ? await supabase.from('listing_specs').insert(specRows) : { error: null };

    setBusy(false);
    if (imgErr || specErr) return setError(t('partialError'));
    onDone();
  }

  const Row = ({ children }) => <View style={styles.wrap}>{children}</View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>نشر إعلان</Text>

        <Text style={styles.label}>التصنيف</Text>
        <Row>{categories.map((c) => (
          <Chip key={c.id} label={c.name_ar} on={f.category_id === c.id} onPress={() => set('category_id')(c.id)} />
        ))}</Row>

        <TextInput style={styles.input} placeholder="عنوان الإعلان (مثال: آيفون 13 برو 256GB)" value={f.title}
          onChangeText={set('title')} maxLength={120} textAlign="right" />
        <TextInput style={styles.input} placeholder="السعر" value={f.price} onChangeText={set('price')}
          keyboardType="numeric" textAlign="right" />
        <Row>
          <Chip label="دينار عراقي" on={f.currency === 'IQD'} onPress={() => set('currency')('IQD')} />
          <Chip label="دولار" on={f.currency === 'USD'} onPress={() => set('currency')('USD')} />
        </Row>

        <Text style={styles.label}>الحالة</Text>
        <Row>{Object.entries(CONDITION_LABELS).map(([k, v]) => (
          <Chip key={k} label={v} on={f.condition === k} onPress={() => set('condition')(k)} />
        ))}</Row>

        <TextInput style={styles.input} placeholder="الماركة (اختياري)" value={f.brand} onChangeText={set('brand')} maxLength={60} textAlign="right" />
        <TextInput style={styles.input} placeholder="الموديل (اختياري)" value={f.model} onChangeText={set('model')} maxLength={60} textAlign="right" />

        <Text style={styles.label}>المحافظة</Text>
        <Row>{GOVERNORATES.map((g) => (
          <Chip key={g} label={g} on={f.governorate === g} onPress={() => set('governorate')(g)} />
        ))}</Row>
        <TextInput style={styles.input} placeholder="المدينة / المنطقة" value={f.city} onChangeText={set('city')} maxLength={60} textAlign="right" />
        <TextInput style={styles.input} placeholder="رقم التواصل" value={f.contact_phone} onChangeText={set('contact_phone')}
          keyboardType="phone-pad" maxLength={20} />

        <Text style={styles.label}>المواصفات (اختياري)</Text>
        {SPECS.map(([k, label]) => (
          <TextInput key={k} style={styles.input} placeholder={label} value={f[`spec_${k}`]}
            onChangeText={set(`spec_${k}`)} maxLength={60} textAlign="right" />
        ))}

        <TextInput style={[styles.input, { height: 110, textAlignVertical: 'top' }]} placeholder="وصف الجهاز وحالته (اختياري)"
          value={f.description} onChangeText={set('description')} multiline maxLength={4000} textAlign="right" />

        <Pressable style={styles.pick} onPress={pick}>
          <Text style={{ color: COLORS.gold }}>{t('addImages')} ({images.length}/{MAX_IMAGES})</Text>
        </Pressable>
        <Row>{images.map((img, i) => (
          <View key={img.uri} style={styles.thumbWrap}>
            <Image source={{ uri: img.uri }} style={styles.thumb} />
            <Pressable style={styles.x} onPress={() => setImages(images.filter((_, j) => j !== i))}>
              <Text style={{ color: '#fff' }}>×</Text>
            </Pressable>
          </View>
        ))}</Row>

        <Text style={styles.note}>{t('reviewNote')}</Text>
        {!!error && <Text style={styles.err}>{error}</Text>}
        <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.btnText}>نشر الإعلان</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 10, paddingBottom: 60 },
  h1: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: COLORS.text },
  label: { color: COLORS.muted, textAlign: 'right', marginTop: 6 },
  input: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 16, color: COLORS.text },
  wrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  pick: { borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.gold, borderRadius: 10, padding: 12, alignItems: 'center' },
  thumbWrap: { width: 84, height: 84 },
  thumb: { width: 84, height: 84, borderRadius: 8 },
  x: { position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
  note: { color: COLORS.muted, textAlign: 'right', fontSize: 13 },
  err: { color: COLORS.danger, textAlign: 'center' },
  btn: { backgroundColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 6 },
  btnText: { color: COLORS.bg, fontWeight: '700', fontSize: 16 },
});
