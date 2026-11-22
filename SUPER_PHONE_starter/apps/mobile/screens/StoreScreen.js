import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase, imageUrl } from '../lib/supabase';
import { formatPrice } from '../lib/constants';
import { categoryLabel, governorateLabel } from '../lib/i18n';
import BrowseScreen from './BrowseScreen';

const ICONS = {
  phone: '▯', phones: '▯', tablet: '▱', laptop: '▣', desktop: '▤',
  headphones: '♫', smartwatch: '◷',
};

function firstImage(item) {
  return [...(item?.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];
}

const COPY = {
  ar: {
    title: 'المتجر', banner: 'كل الأجهزة التي تبحث عنها', bannerText: 'هواتف وأجهزة ذكية من بائعين في جميع محافظات العراق',
    accessories: 'الإكسسوارات', phones: 'الهواتف', featured: 'الأجهزة المميزة', categories: 'التصنيفات الشائعة',
    latest: 'أحدث الأجهزة', all: 'عرض الكل', empty: 'ستظهر الأجهزة هنا عند نشر الإعلانات المعتمدة.',
    hint: 'اختر الفئة لمشاهدة الأجهزة المتاحة'
  },
  en: {
    title: 'Store', banner: 'Find the device you want', bannerText: 'Phones and smart devices from sellers across Iraq',
    accessories: 'Accessories', phones: 'Phones', featured: 'Featured devices', categories: 'Popular categories',
    latest: 'Latest devices', all: 'View all', empty: 'Approved listings will appear here.',
    hint: 'Choose a category to browse available devices'
  },
  ku: {
    title: 'فرۆشگا', banner: 'هەموو ئامێرەکانی دەتەوێت', bannerText: 'مۆبایل و ئامێری زیرەک لە فرۆشیارانی هەموو پارێزگاکانی عێراق',
    accessories: 'ئاکسسوارات', phones: 'مۆبایل', featured: 'ئامێرە دیارەکان', categories: 'پۆلە باوەکان',
    latest: 'نوێترین ئامێرەکان', all: 'بینینی هەموو', empty: 'ڕیکلامە پەسەندکراوەکان لێرە دەردەکەون.',
    hint: 'پۆلێک هەڵبژێرە بۆ بینینی ئامێرەکان'
  }
};

export default function StoreScreen({ lang = 'ar', onOpen, onSell, onFavorites }) {
  const t = COPY[lang] || COPY.ar;
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      supabase.from('categories').select('id,slug,name_ar').eq('is_active', true).order('sort_order'),
      supabase.from('listings').select('id,title,price,currency,condition,governorate,city,created_at,categories!inner(slug,name_ar),listing_images(storage_path,sort_order)').eq('status', 'active').order('created_at', { ascending: false }).limit(10)
    ]).then(([categoryResult, listingResult]) => {
      if (!alive) return;
      setCategories(categoryResult.data || []);
      setProducts(listingResult.data || []);
      setLoading(false);
    }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const findCategory = (pattern) => categories.find((item) => pattern.test(item.slug + ' ' + item.name_ar));

  if (loading) return <View style={styles.center}><ActivityIndicator color="#C8102E" /></View>;

  if (selected) {
    const category = categories.find((item) => item.slug === selected);
    return (
      <View style={styles.flex}>
        <View style={styles.selectedHeader}>
          <Pressable onPress={() => setSelected('')} style={styles.back}><Text style={styles.backText}>‹  {lang === 'en' ? 'All categories' : lang === 'ku' ? 'هەموو پۆلەکان' : 'كل الفئات'}</Text></Pressable>
          <Text style={styles.selectedTitle}>{category ? categoryLabel(lang, category.name_ar) : ''}</Text>
        </View>
        <BrowseScreen key={selected} lang={lang} fixedCategorySlug={selected} onOpen={onOpen} onSell={onSell} onFavorites={onFavorites} />
      </View>
    );
  }

  const featured = products.slice(0, 4);
  const popularCategory = categories.slice(0, 4);

  const renderProduct = (item) => {
    const photo = firstImage(item);
    return (
      <Pressable key={item.id} style={styles.productCard} onPress={() => onOpen(item.id)}>
        {photo ? <Image source={{ uri: imageUrl(photo.storage_path) }} style={styles.productImage} resizeMode="cover" /> :
          <View style={[styles.productImage, styles.noImage]}><Text style={styles.productIcon}>▯</Text></View>}
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.productPrice}>{formatPrice(item.price, item.currency)}</Text>
          <Text style={styles.productLocation} numberOfLines={1}>{governorateLabel(lang, item.governorate)}{item.city ? ' · ' + item.city : ''}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>{t.title}</Text>

      <Pressable style={styles.mainBanner} onPress={onSell}>
        <View style={styles.bannerArtwork}>
          <View style={styles.phoneBack}><View style={styles.cameraDot} /><View style={styles.cameraDot} /><View style={styles.cameraDot} /></View>
          <View style={styles.phoneFront}><View style={styles.screenLine} /></View>
        </View>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerKicker}>SUPER PHONE</Text>
          <Text style={styles.bannerTitle}>{t.banner}</Text>
          <Text style={styles.bannerText}>{t.bannerText}</Text>
        </View>
        <View style={styles.newBadge}><Text style={styles.newBadgeText}>جديد</Text></View>
      </Pressable>

      <View style={styles.featureRow}>
        <Pressable style={[styles.featureTile, styles.featureAccessories]} onPress={() => { const c = findCategory(/headphone|accessor|سماعات|اكسسوارات|إكسسوارات/i); if (c) setSelected(c.slug); }}>
          <Text style={styles.featureIcon}>♫</Text>
          <Text style={styles.featureTitle}>{t.accessories}</Text>
        </Pressable>
        <Pressable style={[styles.featureTile, styles.featurePhones]} onPress={() => { const c = findCategory(/phone|mobile|هاتف|موبايل/i); if (c) setSelected(c.slug); }}>
          <Text style={styles.featureIcon}>▯</Text>
          <Text style={styles.featureTitle}>{t.phones}</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{t.featured}</Text>
        <Pressable onPress={() => setSelected((categories[0] || {}).slug || '')}><Text style={styles.viewAll}>{t.all} ‹</Text></Pressable>
      </View>
      {featured.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalProducts}>
          {featured.map(renderProduct)}
        </ScrollView>
      ) : <Text style={styles.empty}>{t.empty}</Text>}

      <Text style={styles.sectionTitleStandalone}>{t.categories}</Text>
      <View style={styles.categoryGrid}>
        {popularCategory.map((item) => (
          <Pressable key={item.id} onPress={() => setSelected(item.slug)} style={styles.categoryCard}>
            <Text style={styles.categoryIcon}>{ICONS[item.slug] || '▯'}</Text>
            <Text style={styles.categoryName}>{categoryLabel(lang, item.name_ar)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{t.latest}</Text>
        <Pressable onPress={onSell}><Text style={styles.viewAll}>{t.all} ‹</Text></Pressable>
      </View>
      <View style={styles.productGrid}>
        {products.slice(4, 10).map(renderProduct)}
      </View>
      {!products.length ? <Text style={styles.empty}>{t.hint}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#ffffff' },
  page: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingBottom: 28 },
  heading: { color: '#333333', fontSize: 25, fontWeight: '900', textAlign: 'right', paddingHorizontal: 18, paddingTop: 22, paddingBottom: 14 },
  mainBanner: { minHeight: 176, marginHorizontal: 16, borderRadius: 12, padding: 15, backgroundColor: '#1769b7', flexDirection: 'row-reverse', alignItems: 'center', overflow: 'hidden' },
  bannerCopy: { flex: 1, zIndex: 1 },
  bannerKicker: { color: '#cbe4ff', fontSize: 10, fontWeight: '900', letterSpacing: 2, textAlign: 'right' },
  bannerTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'right', marginTop: 8, lineHeight: 29 },
  bannerText: { color: '#edf6ff', fontSize: 12, lineHeight: 18, textAlign: 'right', marginTop: 5 },
  bannerArtwork: { width: 100, height: 135, position: 'relative', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  phoneBack: { width: 53, height: 104, borderRadius: 11, borderWidth: 3, borderColor: '#dceaff', backgroundColor: '#1d3150', position: 'absolute', left: 5, top: 15, padding: 7, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cameraDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9bb8d9', borderWidth: 1, borderColor: '#ffffff' },
  phoneFront: { width: 53, height: 110, borderRadius: 12, borderWidth: 3, borderColor: '#ffffff', backgroundColor: '#bfdcff', position: 'absolute', right: 1, top: 9, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8 },
  screenLine: { width: 20, height: 3, borderRadius: 2, backgroundColor: '#1769b7' },
  newBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#ed646b', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 5 },
  newBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  featureRow: { flexDirection: 'row-reverse', gap: 12, marginHorizontal: 16, marginTop: 14 },
  featureTile: { flex: 1, minHeight: 132, borderRadius: 13, padding: 14, justifyContent: 'space-between' },
  featureAccessories: { backgroundColor: '#7027bd' },
  featurePhones: { backgroundColor: '#f2762c' },
  featureIcon: { color: '#ffffff', fontSize: 38, fontWeight: '800' },
  featureTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'right' },
  sectionHeading: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 10, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#454545', fontSize: 18, fontWeight: '800', textAlign: 'right' },
  sectionTitleStandalone: { color: '#454545', fontSize: 18, fontWeight: '800', textAlign: 'right', paddingHorizontal: 18, marginTop: 24, marginBottom: 12 },
  viewAll: { color: '#C8102E', fontSize: 12, fontWeight: '800' },
  horizontalProducts: { paddingHorizontal: 10, gap: 10, flexDirection: 'row-reverse' },
  productGrid: { paddingHorizontal: 12, flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  productCard: { width: 205, maxWidth: '48%', minHeight: 190, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 10, overflow: 'hidden' },
  productImage: { width: '100%', height: 126, backgroundColor: '#f1f1f1' },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  productIcon: { color: '#C8102E', fontSize: 42 },
  productInfo: { padding: 8, gap: 4 },
  productTitle: { color: '#333333', fontSize: 13, fontWeight: '800', textAlign: 'right' },
  productPrice: { color: '#C8102E', fontSize: 14, fontWeight: '900', textAlign: 'right' },
  productLocation: { color: '#888888', fontSize: 10, textAlign: 'right' },
  categoryGrid: { paddingHorizontal: 14, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  categoryCard: { width: '48%', minHeight: 88, padding: 12, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 10, backgroundColor: '#fafafa', flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  categoryIcon: { color: '#C8102E', fontSize: 27 },
  categoryName: { color: '#444444', fontSize: 14, fontWeight: '800', textAlign: 'right', flex: 1 },
  empty: { color: '#888888', textAlign: 'center', padding: 20, fontSize: 13 },
  selectedHeader: { paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eeeeee', backgroundColor: '#ffffff' },
  selectedTitle: { color: '#333333', fontWeight: '900', fontSize: 17 },
  back: { padding: 6 },
  backText: { color: '#C8102E', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
});
