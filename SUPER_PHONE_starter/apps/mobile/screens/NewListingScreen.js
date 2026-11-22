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
import { tr, conditionLabel, governorateLabel, categoryLabel } from '../lib/i18n';

const SPEC_KEYS = ['screen', 'processor', 'ram', 'storage', 'cameras', 'battery', 'charging_speed', 'release_year'];

export default function NewListingScreen({ onDone, lang = 'ar' }) {
  const tx = (key) => tr(lang, key);
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [f, setF] = useState({
    category_id: '', title: '', price: '', currency: 'IQD', condition: '', brand: '', model: '',
    governorate: '', city: '', contact_phone: '', description: '',
    spec_screen: '', spec_processor: '', spec_ram: '', spec_storage: '', spec_cameras: '', spec_battery: '', spec_charging_speed: '', spec_release_year: '',
  });
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.from('categories').select('id,name_ar').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCategories(data || []));
    supabase.from('profiles').select('phone,governorate,city').eq('id', user.id).single()
      .then(({ data }) => data && setF((p) => ({
        ...p, contact_phone: p.contact_phone || data.phone || '', governorate: p.governorate || data.governorate || '', city: p.city || data.city || '',
      })));
  }, [user.id]);

  async function pick() {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7,
      });
      if (res.canceled) return;
      const next = [];
      for (const asset of res.assets) {
        const type = asset.mimeType || 'image/jpeg';
        if (!IMAGE_EXT[type]) return setError(tx('imageTypeError'));
        if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) return setError(tx('imageSizeError'));
        next.push({ uri: asset.uri, type });
      }
      setError('');
      setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    } catch {
      setError(tx('pickerError'));
    }
  }

  async function submit() {
    setError('');
    if (busy) return;
    const price = Number(f.price);
    if (!f.category_id || !f.condition || !f.governorate) return setError(tx('chooseRequired'));
    if (!f.brand.trim() || !f.model.trim() || SPEC_KEYS.some((key) => !String(f['spec_' + key] || '').trim())) return setError(tx('requiredSpecsError'));
    if (f.title.trim().length < 3) return setError(tx('titleRequired'));
    if (!f.price || !Number.isFinite(price) || price <= 0) return setError(tx('priceRequired'));
    if (!f.contact_phone.trim()) return setError(tx('phoneRequired'));
    if (images.length === 0) return setError(tx('imageRequired'));

    setBusy(true);
    const uploaded = [];
    let listingCreated = false;
    let imageRowsSaved = false;
    const cleanup = async () => {
      if (!uploaded.length) return;
      try {
        const { error: cleanupError } = await supabase.storage.from('listing-images').remove(uploaded);
        if (cleanupError) console.warn('Listing image cleanup failed', cleanupError);
      } catch (cleanupError) {
        console.warn('Listing image cleanup failed', cleanupError);
      }
    };

    try {
      for (const img of images) {
        const path = user.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + IMAGE_EXT[img.type];
        const response = await fetch(img.uri);
        if (!response.ok) throw new Error('Could not read selected image');
        const buffer = await response.arrayBuffer();
        const { error: uploadError } = await supabase.storage.from('listing-images')
          .upload(path, buffer, { contentType: img.type, upsert: false });
        if (uploadError) throw uploadError;
        uploaded.push(path);
      }

      const trim = (value) => (value || '').trim();
      const { data: createdListing, error: insertError } = await supabase.from('listings').insert({
        seller_id: user.id,
        category_id: f.category_id,
        title: trim(f.title),
        description: trim(f.description) || null,
        price,
        currency: f.currency,
        condition: f.condition,
        brand: trim(f.brand) || null,
        model: trim(f.model) || null,
        governorate: f.governorate,
        city: trim(f.city) || null,
        contact_phone: trim(f.contact_phone),
        status: 'pending_review',
      }).select('id').single();

      if (insertError || !createdListing) {
        await cleanup();
        setError(tx('submitError'));
        return;
      }
      listingCreated = true;

      const { error: imageError } = await supabase.from('listing_images').insert(
        uploaded.map((storage_path, index) => ({
          listing_id: createdListing.id,
          storage_path,
          sort_order: index,
        }))
      );

      if (imageError) {
        await cleanup();
        setError(tx('partialError'));
        return;
      }
      imageRowsSaved = true;

      const specRows = SPEC_KEYS.map((key) => ({
        listing_id: createdListing.id,
        spec_key: key,
        spec_value: trim(f['spec_' + key]),
      })).filter((spec) => spec.spec_value);

      if (specRows.length) {
        const { error: specError } = await supabase.from('listing_specs').insert(specRows);
        if (specError) {
          setError(tx('partialError'));
          return;
        }
      }

      onDone?.();
    } catch (submitError) {
      console.warn('Listing submission failed', submitError);
      if (!imageRowsSaved) await cleanup();
      setError(listingCreated ? tx('partialError') : tx('submitError'));
    } finally {
      setBusy(false);
    }
  }

  const Row = ({ children }) => <View style={styles.wrap}>{children}</View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>{tx('post')}</Text>

        <Text style={styles.label}>{tx('category')}</Text>
        <Row>{categories.map((c) => (
          <Chip key={c.id} label={categoryLabel(lang, c.name_ar)} on={f.category_id === c.id} onPress={() => set('category_id')(c.id)} />
        ))}</Row>

        <TextInput style={styles.input} placeholder={tx('titlePlaceholder')} value={f.title}
          onChangeText={set('title')} maxLength={120} textAlign="right" />
        <TextInput style={styles.input} placeholder={tx('price')} value={f.price} onChangeText={set('price')}
          keyboardType="numeric" textAlign="right" />
        <Row>
          <Chip label={tx('currencyIQD')} on={f.currency === 'IQD'} onPress={() => set('currency')('IQD')} />
          <Chip label={tx('currencyUSD')} on={f.currency === 'USD'} onPress={() => set('currency')('USD')} />
        </Row>

        <Text style={styles.label}>{tx('condition')}</Text>
        <Row>{Object.entries(CONDITION_LABELS).map(([k, v]) => (
          <Chip key={k} label={conditionLabel(lang, k, v)} on={f.condition === k} onPress={() => set('condition')(k)} />
        ))}</Row>

        <TextInput style={styles.input} placeholder={tx('brand')} value={f.brand} onChangeText={set('brand')} maxLength={60} textAlign="right" />
        <TextInput style={styles.input} placeholder={tx('model')} value={f.model} onChangeText={set('model')} maxLength={60} textAlign="right" />

        <Text style={styles.label}>{tx('governorate')}</Text>
        <Row>{GOVERNORATES.map((g) => (
          <Chip key={g} label={governorateLabel(lang, g)} on={f.governorate === g} onPress={() => set('governorate')(g)} />
        ))}</Row>
        <TextInput style={styles.input} placeholder={tx('area')} value={f.city} onChangeText={set('city')} maxLength={60} textAlign="right" />
        <TextInput style={styles.input} placeholder={tx('phone')} value={f.contact_phone} onChangeText={set('contact_phone')}
          keyboardType="phone-pad" maxLength={20} />

        <Text style={styles.label}>{tx('specsRequired')}</Text>
        {SPEC_KEYS.map((k) => (
          <TextInput key={k} style={styles.input} placeholder={tx(k)} value={f[`spec_${k}`]}
            onChangeText={set(`spec_${k}`)} maxLength={80} textAlign="right" />
        ))}

        <TextInput style={[styles.input, { height: 110, textAlignVertical: 'top' }]} placeholder={tx('description')}
          value={f.description} onChangeText={set('description')} multiline maxLength={4000} textAlign="right" />

        <Pressable style={styles.pick} onPress={pick}>
          <Text style={{ color: COLORS.gold }}>{tx('addImages')} ({images.length}/{MAX_IMAGES})</Text>
        </Pressable>
        <Row>{images.map((img, i) => (
          <View key={img.uri} style={styles.thumbWrap}>
            <Image source={{ uri: img.uri }} style={styles.thumb} />
            <Pressable style={styles.x} onPress={() => setImages(images.filter((_, j) => j !== i))}>
              <Text style={{ color: '#fff' }}>×</Text>
            </Pressable>
          </View>
        ))}</Row>

        <Text style={styles.note}>{tx('reviewNote')}</Text>
        {!!error && <Text style={styles.err}>{error}</Text>}
        <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.btnText}>{tx('publish')}</Text>}
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
