import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/constants';
import ListingCard from '../components/ListingCard';

export default function FavoritesScreen({ onOpen }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('created_at, listings!inner(id,title,price,currency,condition,governorate,city,categories(slug,name_ar),listing_images(storage_path,sort_order))')
      .eq('user_id', user.id)
      .eq('listings.status', 'active')
      .order('created_at', { ascending: false });
    setItems((data || []).map((r) => r.listings));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.gold} />;
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16 }}
      refreshing={loading}
      onRefresh={load}
      ListEmptyComponent={<Text style={styles.empty}>لم تضف أي إعلان للمفضلة بعد.</Text>}
      renderItem={({ item }) => <ListingCard listing={item} onPress={() => onOpen(item.id)} />}
    />
  );
}

const styles = StyleSheet.create({ empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 } });
