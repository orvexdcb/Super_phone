import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase, imageUrl } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { COLORS, STATUS_LABELS, formatPrice } from '../lib/constants';
import { tr } from '../lib/i18n';

const BADGE = {
  active: ['#234436', COLORS.success], pending_review: ['#49391f', COLORS.goldLight], rejected: ['#482a2b', COLORS.danger],
};

export default function MyListingsScreen({ onOpen, posted, lang = 'ar' }) {
  const t = (key) => tr(lang, key);
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('listings')
      .select('id,title,price,currency,status,rejection_reason,listing_images(storage_path,sort_order)')
      .eq('seller_id', user.id).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.gold} />;
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16 }}
      refreshing={loading}
      onRefresh={load}
      ListHeaderComponent={
        <>
          <Text style={styles.h1}>{t('myListings')}</Text>
          {posted && <Text style={styles.ok}>{t('submitted')}</Text>}
        </>
      }
      ListEmptyComponent={<Text style={styles.empty}>{t('noListings')}</Text>}
      renderItem={({ item }) => {
        const first = [...item.listing_images].sort((a, b) => a.sort_order - b.sort_order)[0];
        const [bg, fg] = BADGE[item.status] || [COLORS.panelAlt, COLORS.text];
        return (
          <Pressable style={styles.row} onPress={() => onOpen(item.id)}>
            {first ? <Image source={{ uri: imageUrl(first.storage_path) }} style={styles.img} /> : <View style={styles.img} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.price}>{formatPrice(item.price, item.currency)}</Text>
              <View style={[styles.badge, { backgroundColor: bg }]}>
                <Text style={{ color: fg, fontSize: 12 }}>{STATUS_LABELS[item.status]}</Text>
              </View>
              {item.status === 'rejected' && !!item.rejection_reason && (
                <Text style={styles.muted}>{t('rejectedReason')}: {item.rejection_reason}</Text>
              )}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: COLORS.text, marginBottom: 12 },
  ok: { color: COLORS.gold, textAlign: 'center', marginBottom: 12 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
  row: { flexDirection: 'row-reverse', gap: 12, backgroundColor: COLORS.panel, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 10, marginBottom: 10 },
  img: { width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.panelAlt },
  title: { fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  price: { color: COLORS.gold, fontWeight: '700', textAlign: 'right', marginVertical: 2 },
  badge: { alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  muted: { color: COLORS.muted, textAlign: 'right', fontSize: 13 },
});
