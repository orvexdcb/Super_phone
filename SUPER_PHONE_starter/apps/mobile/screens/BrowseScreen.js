import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS, CONDITION_LABELS, GOVERNORATES } from '../lib/constants';
import ListingCard from '../components/ListingCard';
import Chip from '../components/Chip';

const PAGE = 20;
const SELECT =
  'id,title,price,currency,condition,governorate,city,created_at,categories!inner(slug,name_ar),listing_images(storage_path,sort_order)';
const EMPTY = { q: '', category: '', condition: '', governorate: '', min: '', max: '' };

export default function BrowseScreen({ onOpen }) {
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState(EMPTY);     // ما يكتبه المستخدم
  const [applied, setApplied] = useState(EMPTY); // ما يُطبَّق على الاستعلام
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const pageRef = useRef(0);
  const reqRef = useRef(0);

  useEffect(() => {
    supabase.from('categories').select('slug,name_ar').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCategories(data || []));
  }, []);

  const fetchPage = useCallback(async (page, f) => {
    let query = supabase.from('listings').select(SELECT).eq('status', 'active')
      .order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE); // عنصر زائد لمعرفة التالي
    const term = f.q.replace(/[%_,]/g, ' ').trim();
    if (term) query = query.ilike('title', `%${term}%`);
    if (f.category) query = query.eq('categories.slug', f.category);
    if (f.condition) query = query.eq('condition', f.condition);
    if (f.governorate) query = query.eq('governorate', f.governorate);
    const min = Number(f.min), max = Number(f.max);
    if (f.min && Number.isFinite(min)) query = query.gte('price', min);
    if (f.max && Number.isFinite(max)) query = query.lte('price', max);
    return query;
  }, []);

  const loadFirst = useCallback(async (f) => {
    const req = ++reqRef.current;
    setLoading(true);
    setError('');
    const { data, error: err } = await fetchPage(0, f);
    if (req !== reqRef.current) return; // تجاهل ردّاً قديماً
    pageRef.current = 0;
    if (err) setError('تعذّر تحميل الإعلانات.');
    const rows = data || [];
    setItems(rows.slice(0, PAGE));
    setHasMore(rows.length > PAGE);
    setLoading(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    const req = reqRef.current;
    setLoadingMore(true);
    const next = pageRef.current + 1;
    const { data } = await fetchPage(next, applied);
    if (req !== reqRef.current) return setLoadingMore(false);
    const rows = data || [];
    pageRef.current = next;
    setItems((prev) => [...prev, ...rows.slice(0, PAGE)]);
    setHasMore(rows.length > PAGE);
    setLoadingMore(false);
  }, [hasMore, loadingMore, loading, fetchPage, applied]);

  useEffect(() => { loadFirst(applied); }, [applied, loadFirst]);

  const apply = (next) => { setApplied(next); setShowFilters(false); };
  const set = (k) => (v) => setDraft((p) => ({ ...p, [k]: v }));
  const toggle = (k, v) => setDraft((p) => ({ ...p, [k]: p[k] === v ? '' : v }));
  const activeCount = ['condition', 'governorate', 'min', 'max'].filter((k) => applied[k]).length;

  return (
    <View style={styles.flex}>
      <View style={styles.search}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={draft.q}
          onChangeText={set('q')}
          placeholder="ابحث عن جهاز..."
          textAlign="right"
          returnKeyType="search"
          onSubmitEditing={() => apply(draft)}
        />
        <Pressable style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
          <Text style={{ color: COLORS.green }}>تصفية{activeCount ? ` (${activeCount})` : ''}</Text>
        </Pressable>
      </View>

      {showFilters && (
        <ScrollView style={styles.panel} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>الحالة</Text>
          <View style={styles.wrap}>
            {Object.entries(CONDITION_LABELS).map(([k, v]) => (
              <Chip key={k} label={v} on={draft.condition === k} onPress={() => toggle('condition', k)} />
            ))}
          </View>
          <Text style={styles.label}>المحافظة</Text>
          <View style={styles.wrap}>
            {GOVERNORATES.map((g) => (
              <Chip key={g} label={g} on={draft.governorate === g} onPress={() => toggle('governorate', g)} />
            ))}
          </View>
          <Text style={styles.label}>السعر</Text>
          <View style={styles.priceRow}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="أعلى سعر" value={draft.max}
              onChangeText={set('max')} keyboardType="numeric" textAlign="right" />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="أدنى سعر" value={draft.min}
              onChangeText={set('min')} keyboardType="numeric" textAlign="right" />
          </View>
          <View style={styles.priceRow}>
            <Pressable style={[styles.apply, { backgroundColor: COLORS.panel, borderColor: COLORS.border, borderWidth: 1 }]}
              onPress={() => { const cleared = { ...EMPTY, q: draft.q, category: draft.category }; setDraft(cleared); apply(cleared); }}>
              <Text style={{ color: COLORS.text }}>مسح</Text>
            </Pressable>
            <Pressable style={styles.apply} onPress={() => apply(draft)}>
              <Text style={{ color: COLORS.bg, fontWeight: '800' }}>تطبيق</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      <View style={styles.homeActions}>
        <Pressable style={styles.homeAction} onPress={() => onOpen('new')}><Text style={styles.homeActionText}>بيع هاتفك</Text></Pressable>
        <Pressable style={styles.homeAction} onPress={() => setShowFilters(true)}><Text style={styles.homeActionText}>بحث</Text></Pressable>
        <Pressable style={styles.homeAction} onPress={() => {}}><Text style={styles.homeActionText}>المفضلة</Text></Pressable>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ slug: '', name_ar: 'الكل' }, ...categories].map((c) => (
            <Chip key={c.slug || 'all'} label={c.name_ar} on={applied.category === c.slug}
              onPress={() => { const n = { ...draft, category: c.slug }; setDraft(n); apply(n); }} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.gold} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16 }}
          refreshing={loading}
          onRefresh={() => loadFirst(applied)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.green} /> : null}
          ListEmptyComponent={<Text style={styles.empty}>{error || 'لا توجد إعلانات مطابقة حالياً.'}</Text>}
          renderItem={({ item }) => <ListingCard listing={item} onPress={() => onOpen(item.id)} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  homeActions: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  homeAction: { flex: 1, backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  homeActionText: { color: COLORS.bg, fontWeight: '900', fontSize: 13 },
  search: { flexDirection: 'row-reverse', gap: 8, padding: 16, paddingBottom: 8 },
  input: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 16, color: COLORS.text },
  filterBtn: { justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.gold, backgroundColor: COLORS.panel },
  panel: { maxHeight: 360, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: COLORS.bg },
  label: { color: COLORS.muted, textAlign: 'right', marginTop: 8, marginBottom: 6 },
  wrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  priceRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 8 },
  apply: { flex: 1, backgroundColor: COLORS.gold, borderRadius: 10, padding: 12, alignItems: 'center' },
  chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 4, flexDirection: 'row-reverse' },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
