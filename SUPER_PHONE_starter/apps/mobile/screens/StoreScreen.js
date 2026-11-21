import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/constants';
import { categoryLabel } from '../lib/i18n';
import BrowseScreen from './BrowseScreen';

const ICONS = {
  phone: '▯', phones: '▯', tablet: '▱', laptop: '▣', desktop: '▤', headphones: '♫', smartwatch: '◷',
};
const EN_LABELS = { phone: 'Phones', phones: 'Phones', tablet: 'Tablets', laptop: 'Laptops', desktop: 'Computers', headphones: 'Headphones', smartwatch: 'Smart watches' };

export default function StoreScreen({ lang = 'ar', onOpen, onSell, onFavorites }) {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.from('categories').select('id,slug,name_ar').eq('is_active', true).order('sort_order')
      .then(({ data }) => {
        if (!alive) return;
        setCategories(data || []);
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#e84b53" /></View>;

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

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{lang === 'en' ? 'Store' : lang === 'ku' ? 'فرۆشگا' : 'المتجر'}</Text>
      <Pressable style={styles.mainBanner} onPress={() => categories[0] && setSelected(categories[0].slug)}>
        <Text style={styles.bannerKicker}>SUPER PHONE</Text>
        <Text style={styles.bannerTitle}>{lang === 'en' ? 'Your smart-device store' : lang === 'ku' ? 'فرۆشگای ئامێرە زیرەکەکان' : 'متجر الأجهزة الذكية'}</Text>
        <Text style={styles.bannerText}>{lang === 'en' ? 'Phones, tablets, computers, audio and wearables.' : lang === 'ku' ? 'مۆبایل، تابلێت، کۆمپیوتەر، دەنگ و کاتژمێری زیرەک.' : 'هواتف، أجهزة لوحية، حواسيب، سماعات وساعات ذكية.'}</Text>
        <Text style={styles.bannerMark}>▯</Text>
      </Pressable>

      <View style={styles.featureRow}>
        <Pressable style={[styles.featureTile, styles.featurePhones]} onPress={() => {
          const p = categories.find((c) => /phone|mobile|هاتف|موبايل/i.test(c.slug + ' ' + c.name_ar));
          if (p) setSelected(p.slug);
        }}>
          <Text style={styles.featureIcon}>▯</Text>
          <Text style={styles.featureTitle}>{lang === 'en' ? 'Mobile phones' : lang === 'ku' ? 'مۆبایل' : 'الهواتف'}</Text>
        </Pressable>
        <Pressable style={[styles.featureTile, styles.featureAudio]} onPress={() => {
          const p = categories.find((c) => /headphone|smartwatch|سماعات|ساعات/i.test(c.slug + ' ' + c.name_ar));
          if (p) setSelected(p.slug);
        }}>
          <Text style={styles.featureIcon}>♫</Text>
          <Text style={styles.featureTitle}>{lang === 'en' ? 'Audio & wearables' : lang === 'ku' ? 'دەنگ و کاتژمێر' : 'السماعات والساعات'}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{lang === 'en' ? 'Browse all categories' : lang === 'ku' ? 'گەڕان بە هەموو پۆلەکاندا' : 'تصفح جميع الفئات'}</Text>
      <View style={styles.grid}>
        {categories.map((item) => (
          <Pressable key={item.id} onPress={() => setSelected(item.slug)} style={styles.categoryCard}>
            <Text style={styles.categoryIcon}>{ICONS[item.slug] || '▯'}</Text>
            <Text style={styles.categoryName}>{categoryLabel(lang, item.name_ar)}</Text>
            <Text style={styles.categoryHint}>{lang === 'en' ? (EN_LABELS[item.slug] || 'Browse devices') : lang === 'ku' ? 'ئامێرەکان ببینە' : 'تصفح الأجهزة'}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.footer}>{lang === 'en' ? 'Choose a category to see available listings.' : lang === 'ku' ? 'پۆلێک هەڵبژێرە بۆ بینینی ڕیکلامەکان.' : 'اختر فئة لعرض الأجهزة المتاحة.'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#ffffff' },
  page: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingBottom: 28 },
  heading: { color: '#333333', fontSize: 25, fontWeight: '900', textAlign: 'right', paddingHorizontal: 18, paddingTop: 22, paddingBottom: 14 },
  mainBanner: { marginHorizontal: 16, minHeight: 180, borderRadius: 16, padding: 20, backgroundColor: '#276dc7', justifyContent: 'center', overflow: 'hidden' },
  bannerKicker: { color: '#dbeaff', fontSize: 11, fontWeight: '900', letterSpacing: 2, textAlign: 'right' },
  bannerTitle: { color: '#ffffff', fontSize: 25, fontWeight: '900', textAlign: 'right', marginTop: 9 },
  bannerText: { color: '#eff6ff', fontSize: 13, textAlign: 'right', marginTop: 7, maxWidth: '82%', lineHeight: 20 },
  bannerMark: { position: 'absolute', left: 14, bottom: 2, color: 'rgba(255,255,255,0.22)', fontSize: 105, fontWeight: '900' },
  featureRow: { flexDirection: 'row-reverse', gap: 12, marginHorizontal: 16, marginTop: 14 },
  featureTile: { flex: 1, minHeight: 132, borderRadius: 14, padding: 14, justifyContent: 'space-between' },
  featurePhones: { backgroundColor: '#e84b53' },
  featureAudio: { backgroundColor: '#ed8a38' },
  featureIcon: { color: '#ffffff', fontSize: 36, fontWeight: '800' },
  featureTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'right' },
  sectionTitle: { color: '#454545', fontSize: 18, fontWeight: '800', textAlign: 'right', marginTop: 24, marginBottom: 12, paddingHorizontal: 18 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, gap: 10 },
  categoryCard: { width: '48%', minHeight: 128, padding: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 13, justifyContent: 'space-between' },
  categoryIcon: { color: '#e84b53', fontSize: 31, textAlign: 'right' },
  categoryName: { color: '#373737', fontSize: 16, fontWeight: '900', textAlign: 'right' },
  categoryHint: { color: '#888888', fontSize: 11, textAlign: 'right' },
  footer: { color: '#888888', fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 22 },
  selectedHeader: { paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eeeeee', backgroundColor: '#ffffff' },
  selectedTitle: { color: '#333333', fontWeight: '900', fontSize: 17 },
  back: { padding: 6 },
  backText: { color: '#e84b53', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
});
