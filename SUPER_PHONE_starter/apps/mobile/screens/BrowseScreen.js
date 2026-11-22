import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase, imageUrl } from '../lib/supabase';
import { COLORS, CONDITION_LABELS, GOVERNORATES, formatPrice } from '../lib/constants';
import ListingCard from '../components/ListingCard';
import Chip from '../components/Chip';
import { conditionLabel, governorateLabel } from '../lib/i18n';

const PAGE = 20;
const SELECT = 'id,title,price,currency,condition,governorate,city,created_at,brand,model,categories!inner(slug,name_ar),listing_images(storage_path,sort_order),listing_specs(spec_key,spec_value)';
const EMPTY = { q: '', category: '', condition: '', governorate: '', min: '', max: '' };
const COPY = {
  ar: { city:'كل المدن', sell:'بيع جهازك', search:'بحث', filter:'فلتر البحث', query:'ابحث عن هاتف أو جهاز...', condition:'حالة الجهاز', governorate:'المحافظة', price:'السعر', min:'أقل سعر', max:'أعلى سعر', clear:'مسح', apply:'تطبيق', all:'الكل', featured:'أجهزة مميزة', latest:'أحدث الأجهزة المعروضة', banner:'بع هاتفك بسهولة', bannerText:'اعرض جهازك بالصور والسعر وتواصل مباشرة مع المشتري.', empty:'لا توجد إعلانات مطابقة حالياً.', error:'تعذّر تحميل الإعلانات. حاول مرة أخرى.', recently:'أضيف حديثاً', choose:'تصفح حسب الفئة' },
  en: { city:'All cities', sell:'Sell', search:'Search', filter:'Search filters', query:'Search phones or devices...', condition:'Device condition', governorate:'Governorate', price:'Price', min:'Min price', max:'Max price', clear:'Clear', apply:'Apply', all:'All', featured:'Featured devices', latest:'Latest listings', banner:'Sell your phone easily', bannerText:'Show your device with photos and a price, and contact buyers directly.', empty:'No matching listings right now.', error:'Could not load listings. Please try again.', recently:'Recently added', choose:'Browse by category' },
  ku: { city:'هەموو شارەکان', sell:'بفرۆشە', search:'گەڕان', filter:'پاڵاوتنی گەڕان', query:'بگەڕێ بۆ مۆبایل یان ئامێر...', condition:'دۆخی ئامێر', governorate:'پارێزگا', price:'نرخ', min:'کەمترین نرخ', max:'زۆرترین نرخ', clear:'پاککردنەوە', apply:'جێبەجێکردن', all:'هەموو', featured:'ئامێرە دیارەکان', latest:'نوێترین ڕیکلامەکان', banner:'مۆبایلەکەت بە ئاسانی بفرۆشە', bannerText:'ئامێرەکەت بە وێنە و نرخ پیشان بدە و ڕاستەوخۆ پەیوەندی بکە.', empty:'هیچ ڕیکلامێکی گونجاو نییە.', error:'بارکردنی ڕیکلامەکان سەرکەوتوو نەبوو.', recently:'تازە زیادکراوە', choose:'بەپێی پۆل بگەڕێ' }
};

function firstImage(listing) {
  return [...(listing?.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];
}

export default function BrowseScreen({ onOpen, onSell, onFavorites, onAccountAction, accountActionLabel, lang = 'ar', fixedCategorySlug = '' }) {
  const t = COPY[lang] || COPY.ar;
  const [draft, setDraft] = useState({ ...EMPTY, category: fixedCategorySlug });
  const [applied, setApplied] = useState({ ...EMPTY, category: fixedCategorySlug });
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const pageRef = useRef(0);
  const reqRef = useRef(0);

  const fetchPage = useCallback(async (page, f) => {
    let query = supabase.from('listings').select(SELECT).eq('status', 'active')
      .order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE);
    const term = f.q.replace(/[%_,]/g, ' ').trim();
    if (term) query = query.ilike('title', '%' + term + '%');
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
    if (req !== reqRef.current) return;
    pageRef.current = 0;
    if (err) setError(t.error);
    const rows = data || [];
    setItems(rows.slice(0, PAGE));
    setHasMore(rows.length > PAGE);
    setLoading(false);
  }, [fetchPage, t.error]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    const req = reqRef.current;
    setLoadingMore(true);
    const next = pageRef.current + 1;
    const { data } = await fetchPage(next, applied);
    if (req !== reqRef.current) { setLoadingMore(false); return; }
    const rows = data || [];
    pageRef.current = next;
    setItems((prev) => [...prev, ...rows.slice(0, PAGE)]);
    setHasMore(rows.length > PAGE);
    setLoadingMore(false);
  }, [hasMore, loadingMore, loading, fetchPage, applied]);

  useEffect(() => { loadFirst(applied); }, [applied, loadFirst]);

  const set = (key) => (value) => setDraft((p) => ({ ...p, [key]: value }));
  const toggle = (key, value) => setDraft((p) => ({ ...p, [key]: p[key] === value ? '' : value }));
  const apply = (next) => {
    setApplied({ ...next, category: fixedCategorySlug || next.category });
    setShowFilters(false);
  };
  const activeCount = ['condition', 'governorate', 'min', 'max'].filter((key) => applied[key]).length;
  const featured = fixedCategorySlug ? null : items[0];
  const rows = (featured ? items.slice(1) : items).flatMap((item, index) => {
    const itemNumber = (featured ? 1 : 0) + index + 1;
    return itemNumber % 5 === 0 ? [item, { id: `promo-${itemNumber}`, __type: 'promo' }] : [item];
  });

  const header = (
    <View>
      <View style={styles.topBar}>
        <Pressable style={styles.cityButton} onPress={() => setShowFilters((v) => !v)}>
          <Text style={styles.pin}>⌖</Text>
          <Text style={styles.cityText}>{applied.governorate ? governorateLabel(lang, applied.governorate) : t.city}</Text>
        </Pressable>
        <View style={styles.topActions}>
          <Pressable style={styles.outlineButton} onPress={onSell}><Text style={styles.outlineButtonText}>＋ {t.sell}</Text></Pressable>
          <Pressable style={styles.outlineButton} onPress={() => setShowFilters((v) => !v)}><Text style={styles.outlineButtonText}>⌕ {t.search}</Text></Pressable>
          <Pressable style={styles.outlineButton} onPress={onFavorites}><Text style={styles.outlineButtonText}>♡ {lang === 'en' ? 'Favorites' : lang === 'ku' ? 'دڵخوازەکان' : 'المفضلة'}</Text></Pressable>
          <Pressable style={[styles.outlineButton, styles.accountTopButton]} onPress={onAccountAction}><Text style={[styles.outlineButtonText, styles.accountTopText]}>{accountActionLabel || (lang === 'en' ? 'Account' : lang === 'ku' ? 'هەژمار' : 'حساب')}</Text></Pressable>
        </View>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <TextInput style={styles.input} value={draft.q} onChangeText={set('q')} placeholder={t.query}
            placeholderTextColor={COLORS.muted} textAlign="right" returnKeyType="search" onSubmitEditing={() => apply(draft)} />
          <Text style={styles.label}>{t.condition}</Text>
          <View style={styles.wrap}>
            {Object.entries(CONDITION_LABELS).map(([key, value]) => (
              <Chip key={key} label={conditionLabel(lang, key, value)} on={draft.condition === key} onPress={() => toggle('condition', key)} />
            ))}
          </View>
          <Text style={styles.label}>{t.governorate}</Text>
          <View style={styles.wrap}>
            {GOVERNORATES.map((g) => <Chip key={g} label={governorateLabel(lang, g)} on={draft.governorate === g} onPress={() => toggle('governorate', g)} />)}
          </View>
          <Text style={styles.label}>{t.price}</Text>
          <View style={styles.priceRow}>
            <TextInput style={[styles.input, styles.priceInput]} placeholder={t.min} placeholderTextColor={COLORS.muted}
              value={draft.min} onChangeText={set('min')} keyboardType="numeric" textAlign="right" />
            <TextInput style={[styles.input, styles.priceInput]} placeholder={t.max} placeholderTextColor={COLORS.muted}
              value={draft.max} onChangeText={set('max')} keyboardType="numeric" textAlign="right" />
          </View>
          <View style={styles.priceRow}>
            <Pressable style={[styles.filterAction, styles.clearAction]} onPress={() => { const cleared = { ...EMPTY, category: fixedCategorySlug }; setDraft(cleared); apply(cleared); }}>
              <Text style={styles.clearText}>{t.clear}</Text>
            </Pressable>
            <Pressable style={styles.filterAction} onPress={() => apply(draft)}><Text style={styles.filterActionText}>{t.apply}</Text></Pressable>
          </View>
        </View>
      )}

      {featured && (
        <View style={styles.featuredSection}>
          <Pressable style={styles.featuredCard} onPress={() => onOpen(featured.id)}>
            {firstImage(featured) ? (
              <Image source={{ uri: imageUrl(firstImage(featured).storage_path) }} style={styles.featuredImage} resizeMode="cover" />
            ) : <View style={[styles.featuredImage, styles.noImage]}><Text style={styles.noImageText}>SUPER PHONE</Text></View>}
            <View style={styles.featuredShade} />
            <View style={styles.featuredPrice}>
              <Text style={styles.featuredCurrency}>{featured.currency === 'USD' ? 'دولار' : 'دينار عراقي'}</Text>
              <Text style={styles.featuredPriceText}>{formatPrice(featured.price, featured.currency)}</Text>
            </View>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.promo} onPress={onSell}>
        {firstImage(items[1] || featured || items[0]) ? (
          <Image source={{ uri: imageUrl(firstImage(items[1] || featured || items[0]).storage_path) }} style={styles.promoImage} resizeMode="cover" />
        ) : null}
        <View style={styles.promoShade} />
        <View style={styles.promoCopy}>
          <Text style={styles.promoBrand}>SUPER PHONE</Text>
          <Text style={styles.promoTitle}>{t.banner}</Text>
          <Text style={styles.promoText}>{t.bannerText}</Text>
          <View style={styles.promoCta}><Text style={styles.promoCtaText}>{lang === 'en' ? 'Post a listing  ←' : lang === 'ku' ? 'دانانی ڕیکلام ←' : 'أضف إعلانك  ←'}</Text></View>
        </View>
      </Pressable>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{t.latest}</Text>
        <Text style={styles.recent}>● {t.recently}</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.flex}
      data={rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      contentContainerStyle={styles.listContent}
      refreshing={loading}
      onRefresh={() => loadFirst(applied)}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.danger} style={{ margin: 18 }} /> : null}
      ListEmptyComponent={
        loading ? <ActivityIndicator color={COLORS.danger} style={{ margin: 36 }} /> :
        <Text style={styles.empty}>{error || (featured ? '' : t.empty)}</Text>
      }
      renderItem={({ item }) => item.__type === 'promo' ? (
        <Pressable style={styles.inlineAd} onPress={onSell}>
          <Text style={styles.inlineAdLabel}>{lang === 'en' ? 'SPONSORED SPACE' : lang === 'ku' ? 'شوێنی ڕیکلام' : 'مساحة إعلانية'}</Text>
          <Text style={styles.inlineAdTitle}>{lang === 'en' ? 'Promote your device on SUPER PHONE' : lang === 'ku' ? 'ئامێرەکەت لە SUPER PHONE بەرز بکەرەوە' : 'روّج لجهازك على SUPER PHONE'}</Text>
          <Text style={styles.inlineAdText}>{lang === 'en' ? 'Reach buyers looking for their next device.' : lang === 'ku' ? 'بگەیەنە بە کڕیارانی بەدوای ئامێری نوێدا.' : 'اعرض جهازك أمام الباحثين عن أجهزتهم القادمة.'}</Text>
          <Text style={styles.inlineAdAction}>{lang === 'en' ? 'Create a listing ←' : lang === 'ku' ? 'دانانی ڕیکلام ←' : 'أضف إعلانك ←'}</Text>
        </Pressable>
      ) : <ListingCard lang={lang} listing={item} onPress={() => onOpen(item.id)} />}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#ffffff' },
  listContent: { paddingBottom: 20 },
  topBar: { minHeight: 66, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: '#ffffff' },
  cityButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, flexShrink: 1 },
  pin: { color: '#C8102E', fontSize: 25, fontWeight: '700' },
  cityText: { color: '#3b3b3b', fontSize: 17, fontWeight: '600' },
  topActions: { flexDirection: 'row', gap: 4, flex: 1, justifyContent: 'flex-end' },
  outlineButton: { flex: 1, minWidth: 0, borderWidth: 1.2, borderColor: '#e2b7be', borderRadius: 9, paddingHorizontal: 3, paddingVertical: 8, backgroundColor: '#ffffff', alignItems: 'center' },
  outlineButtonText: { color: '#C8102E', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  accountTopButton: { backgroundColor: '#C8102E', borderColor: '#C8102E' },
  accountTopText: { color: '#ffffff' },
  filterPanel: { marginHorizontal: 12, marginBottom: 10, padding: 13, gap: 9, borderRadius: 13, borderWidth: 1, borderColor: '#e4e4e4', backgroundColor: '#ffffff' },
  input: { borderWidth: 1, borderColor: '#dedede', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, color: '#333333', backgroundColor: '#ffffff', fontSize: 15 },
  label: { color: '#555555', textAlign: 'right', fontSize: 14, fontWeight: '700', marginTop: 3 },
  wrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  priceRow: { flexDirection: 'row-reverse', gap: 8 },
  priceInput: { flex: 1 },
  filterAction: { flex: 1, backgroundColor: '#C8102E', borderRadius: 9, padding: 12, alignItems: 'center' },
  filterActionText: { color: '#ffffff', fontWeight: '800' },
  clearAction: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dedede' },
  clearText: { color: '#555555', fontWeight: '700' },
  categoriesBlock: { paddingTop: 9, paddingBottom: 5 },
  chips: { paddingHorizontal: 13, paddingVertical: 10, gap: 7, flexDirection: 'row-reverse' },
  featuredSection: { paddingTop: 6 },
  sectionTitle: { color: '#424242', fontSize: 18, fontWeight: '800', textAlign: 'right', paddingHorizontal: 14, paddingBottom: 8 },
  featuredCard: { marginHorizontal: 0, height: 270, overflow: 'hidden', backgroundColor: '#f1f1f1', position: 'relative' },
  featuredImage: { width: '100%', height: '100%' },
  noImage: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f2f2' },
  noImageText: { color: '#C8102E', fontWeight: '900', fontSize: 22, letterSpacing: 2 },
  featuredShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  featuredPrice: { position: 'absolute', left: 12, bottom: 12, backgroundColor: '#C8102E', paddingHorizontal: 13, paddingVertical: 8, minWidth: 145 },
  featuredCurrency: { color: '#ffffff', fontSize: 12 },
  featuredPriceText: { color: '#ffffff', fontWeight: '900', fontSize: 18 },
  featuredTitleWrap: { position: 'absolute', right: 12, top: 12, maxWidth: '70%', padding: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8 },
  featuredTitle: { color: '#333333', fontWeight: '900', fontSize: 16, textAlign: 'right' },
  featuredLocation: { color: '#666666', textAlign: 'right', fontSize: 12 },
  promo: { marginHorizontal: 8, marginTop: 9, marginBottom: 10, padding: 15, minHeight: 126, borderRadius: 9, backgroundColor: '#C8102E', flexDirection: 'row-reverse', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  promoImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  promoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(105,0,18,0.72)' },
  promoCopy: { flex: 1, zIndex: 1, alignItems: 'flex-end' },
  promoBrand: { color: '#ffffff', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  promoTitle: { color: '#ffffff', fontSize: 19, fontWeight: '900', textAlign: 'right', marginTop: 5 },
  promoText: { color: '#ffffff', fontSize: 12, lineHeight: 18, textAlign: 'right', marginTop: 3 },
  promoCta: { backgroundColor: '#ffffff', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 7, marginTop: 8, alignSelf: 'flex-start' },
  promoCtaText: { color: '#C8102E', fontWeight: '900', fontSize: 12 },
  sectionHeading: { paddingTop: 9, paddingBottom: 7, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  recent: { color: '#888888', fontSize: 11, paddingHorizontal: 14 },
  empty: { color: '#777777', textAlign: 'center', padding: 25, fontSize: 14 },
  inlineAd: { marginHorizontal: 12, marginVertical: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5b2bb', backgroundColor: '#fff7f8', gap: 6 },
  inlineAdLabel: { color: '#C8102E', fontSize: 10, fontWeight: '900', textAlign: 'right', letterSpacing: 1 },
  inlineAdTitle: { color: '#292929', fontSize: 16, fontWeight: '900', textAlign: 'right' },
  inlineAdText: { color: '#666666', fontSize: 12, textAlign: 'right', lineHeight: 18 },
  inlineAdAction: { color: '#C8102E', fontWeight: '900', textAlign: 'left', paddingTop: 4 },
});
