import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { supabase, imageUrl } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { CONDITION_LABELS, COLORS, SPEC_LABELS, formatPrice, toWhatsApp } from '../lib/constants';
import { tr } from '../lib/i18n';

export default function DetailScreen({ id, onNeedLogin, lang = 'ar' }) {
  const t = (key) => tr(lang, key);
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [l, setL] = useState(null);
  const [state, setState] = useState('loading');
  const [fav, setFav] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('listings')
        .select('*, categories(name_ar), listing_images(storage_path, sort_order), listing_specs(spec_key, spec_value)')
        .eq('id', id).maybeSingle();
      if (!data) return setState('missing');
      setL(data);
      setState('ok');
      if (user) {
        const { data: f } = await supabase.from('favorites').select('listing_id')
          .eq('listing_id', id).eq('user_id', user.id).maybeSingle();
        setFav(!!f);
      }
    })();
  }, [id, user]);

  async function toggleFav() {
    if (!user) return onNeedLogin();
    const { error } = fav
      ? await supabase.from('favorites').delete().eq('listing_id', id).eq('user_id', user.id)
      : await supabase.from('favorites').insert({ listing_id: id, user_id: user.id });
    if (!error) setFav(!fav);
  }

  async function sendReport() {
    if (!user) return onNeedLogin();
    if (reason.trim().length < 3) return setReportMsg(t('reportReason'));
    const { error } = await supabase.from('reports').insert({ listing_id: id, reporter_id: user.id, reason: reason.trim() });
    setReporting(false);
    setReason('');
    setReportMsg(error?.code === '23505' ? t('reportDuplicate') : error ? t('reportError') : t('reportSent'));
  }

  if (state === 'loading') return <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.gold} />;
  if (state === 'missing') return <Text style={styles.center}>{t('notFound')}</Text>;

  const images = [...l.listing_images].sort((a, b) => a.sort_order - b.sort_order);
  const wa = l.contact_phone ? toWhatsApp(l.contact_phone) : null;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      {l.status !== 'active' && <Text style={styles.warn}>{t('notPublished')}</Text>}
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {images.length === 0 && <View style={[styles.noimg, { width }]}><Text style={styles.muted}>{t('noImage')}</Text></View>}
        {images.map((im) => (
          <Image key={im.storage_path} source={{ uri: imageUrl(im.storage_path) }} style={{ width, height: width * 0.75 }} resizeMode="cover" />
        ))}
      </ScrollView>
      <View style={styles.body}>
        <Text style={styles.title}>{l.title}</Text>
        <Text style={styles.price}>{formatPrice(l.price, l.currency)}</Text>
        <Text style={styles.muted}>
          {CONDITION_LABELS[l.condition]} · {l.categories?.name_ar} · {l.governorate}{l.city ? ` — ${l.city}` : ''}
        </Text>
        {(l.brand || l.model) && <Text style={styles.muted}>{[l.brand, l.model].filter(Boolean).join(' ')}</Text>}

        {l.listing_specs.length > 0 && (
          <View style={styles.specs}>
            {l.listing_specs.map((s) => (
              <View key={s.spec_key} style={styles.specRow}>
                <Text style={styles.specVal}>{s.spec_value}</Text>
                <Text style={styles.muted}>{(lang === 'en' ? ({storage:'Storage',ram:'RAM',battery_health:'Battery health',color:'Color'}[s.spec_key] || s.spec_key) : lang === 'ku' ? ({storage:'بیرگە',ram:'ڕام',battery_health:'تەندروستی باتری',color:'ڕەنگ'}[s.spec_key] || s.spec_key) : SPEC_LABELS[s.spec_key] || s.spec_key)}</Text>
              </View>
            ))}
          </View>
        )}
        {!!l.description && <Text style={styles.desc}>{l.description}</Text>}

        <Pressable style={styles.ghost} onPress={toggleFav}>
          <Text>{fav ? t('favorited') : t('addFavorite')}</Text>
        </Pressable>

        {l.status === 'active' && user?.id !== l.seller_id && (
          <Pressable style={[styles.ghost, { marginTop: 8 }]} onPress={() => (user ? setReporting(!reporting) : onNeedLogin())}>
            <Text>⚑ {t('report')}</Text>
          </Pressable>
        )}
        {reporting && (
          <View style={{ gap: 8, marginTop: 8 }}>
            <TextInput style={styles.reportInput} placeholder={t('reportPlaceholder')}
              value={reason} onChangeText={setReason} maxLength={500} textAlign="right" multiline />
            <Pressable style={[styles.btn, { backgroundColor: '#b42318' }]} onPress={sendReport}>
              <Text style={styles.btnText}>{t('sendReport')}</Text>
            </Pressable>
          </View>
        )}
        {!!reportMsg && <Text style={[styles.muted, { marginTop: 8, textAlign: 'center' }]}>{reportMsg}</Text>}

        {!!l.contact_phone && (
          <View style={styles.contact}>
            <Pressable style={styles.btn} onPress={() => Linking.openURL(`tel:${l.contact_phone.replace(/[^\d+]/g, '')}`)}>
              <Text style={styles.btnText}>{t('call')}</Text>
            </Pressable>
            {wa && (
              <Pressable style={[styles.btn, { backgroundColor: '#1faa59' }]} onPress={() => Linking.openURL(`https://wa.me/${wa}`)}>
                <Text style={styles.btnText}>{t('whatsapp')}</Text>
              </Pressable>
            )}
          </View>
        )}
        <Text style={styles.safety}>{t('safety')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center', marginTop: 40, color: COLORS.muted },
  warn: { textAlign: 'center', color: '#8a5a00', backgroundColor: '#fdf1d6', padding: 10 },
  noimg: { height: 200, backgroundColor: COLORS.panelAlt, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'right' },
  price: { fontSize: 20, fontWeight: '700', color: COLORS.gold, marginVertical: 6, textAlign: 'right' },
  muted: { color: COLORS.muted, textAlign: 'right' },
  specs: { backgroundColor: COLORS.panel, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginTop: 14 },
  specRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  specVal: { color: COLORS.text, fontWeight: '600' },
  desc: { marginTop: 14, lineHeight: 24, color: COLORS.text, textAlign: 'right' },
  ghost: { marginTop: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.panel, borderRadius: 10, padding: 12, alignItems: 'center' },
  contact: { flexDirection: 'row-reverse', gap: 10, marginTop: 12 },
  btn: { flex: 1, backgroundColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
  btnText: { color: COLORS.bg, fontWeight: '700' },
  reportInput: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, minHeight: 70, textAlignVertical: 'top' },
  safety: { marginTop: 16, backgroundColor: COLORS.panelAlt, color: COLORS.goldLight, padding: 12, borderRadius: 10, textAlign: 'right' },
});
