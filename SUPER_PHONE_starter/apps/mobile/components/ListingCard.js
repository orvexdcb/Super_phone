import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CONDITION_LABELS, COLORS, formatPrice } from '../lib/constants';
import { imageUrl } from '../lib/supabase';
import { tr, conditionLabel, governorateLabel, categoryLabel } from '../lib/i18n';

export default function ListingCard({ listing, onPress, lang = 'ar' }) {
  const t = (key) => tr(lang, key);
  const first = [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        {first ? <Image source={{ uri: imageUrl(first.storage_path) }} style={styles.img} resizeMode="cover" /> :
          <View style={[styles.img, styles.noimg]}><Text style={styles.noimgText}>SUPER PHONE</Text></View>}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        {!!(listing.brand || listing.model) && <Text style={styles.spec} numberOfLines={1}>{[listing.brand, listing.model].filter(Boolean).join(' ')}</Text>}
        <View style={styles.tags}>
          <Text style={styles.tag}>{conditionLabel(lang, listing.condition, CONDITION_LABELS[listing.condition])}</Text>
          <Text style={styles.tag}>{categoryLabel(lang, listing.categories?.name_ar || '')}</Text>
          {(listing.listing_specs || []).filter((s) => ['storage','ram','battery_health'].includes(s.spec_key)).slice(0, 2).map((s) => <Text key={s.spec_key} style={styles.tag}>{s.spec_value}</Text>)}
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>
          <Text style={styles.location}>⌖ {governorateLabel(lang, listing.governorate)}{listing.city ? ' · ' + listing.city : ''}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 11, borderWidth: 1, borderColor: '#e8e8e8', overflow: 'hidden', marginHorizontal: 7, marginBottom: 10, flexDirection: 'row-reverse', minHeight: 126, shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  pressed: { opacity: 0.82 },
  imageWrap: { width: '40%', minHeight: 126, backgroundColor: '#f4f4f4' },
  img: { width: '100%', height: '100%', minHeight: 126 },
  noimg: { alignItems: 'center', justifyContent: 'center' },
  noimgText: { color: '#e84b53', fontSize: 13, fontWeight: '900' },
  body: { flex: 1, minWidth: 0, paddingHorizontal: 10, paddingVertical: 9, justifyContent: 'space-between', gap: 5 },
  title: { fontSize: 16, fontWeight: '800', color: '#383838', textAlign: 'right' },
  spec: { fontSize: 12, color: '#777777', textAlign: 'right' },
  tags: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 5 },
  tag: { color: '#666666', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, fontSize: 10 },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 5, marginTop: 5 },
  price: { fontSize: 16, fontWeight: '900', color: '#e84b53', flexShrink: 0 },
  location: { color: '#777777', fontSize: 11, textAlign: 'right', flexShrink: 1 },
});
