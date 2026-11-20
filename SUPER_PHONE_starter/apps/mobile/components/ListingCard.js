import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CONDITION_LABELS, COLORS, formatPrice } from '../lib/constants';
import { imageUrl } from '../lib/supabase';
import { tr, conditionLabel, governorateLabel, categoryLabel } from '../lib/i18n';

export default function ListingCard({ listing, onPress, lang = 'ar' }) {
  const t = (key) => tr(lang, key);
  const first = [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {first ? (
        <Image source={{ uri: imageUrl(first.storage_path) }} style={styles.img} />
      ) : (
        <View style={[styles.img, styles.noimg]}><Text style={styles.muted}>{t('noImage')}</Text></View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>
        <Text style={styles.muted}>
          {conditionLabel(lang, listing.condition, CONDITION_LABELS[listing.condition])} · {categoryLabel(lang, listing.categories?.name_ar || '')}
        </Text>
        <Text style={styles.muted}>
          {governorateLabel(lang, listing.governorate)}{listing.city ? ` — ${listing.city}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.panel, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 12, flexDirection: 'row-reverse', minHeight: 124 },
  img: { width: '40%', minHeight: 124, backgroundColor: COLORS.panelAlt },
  noimg: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 12, justifyContent: 'center', gap: 3 },
  title: { fontSize: 15, fontWeight: '800', color: COLORS.text, textAlign: 'right' },
  price: { fontSize: 16, fontWeight: '700', color: COLORS.gold, marginVertical: 4, textAlign: 'right' },
  muted: { color: COLORS.muted, fontSize: 13, textAlign: 'right' },
});
