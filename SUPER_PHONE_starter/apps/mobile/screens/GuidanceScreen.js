import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase, imageUrl } from '../lib/supabase';
import { formatPrice } from '../lib/constants';
import { governorateLabel } from '../lib/i18n';

const T = {
  ar: {
    title: 'إرشاد', subtitle: 'أدوات ومعلومات تساعدك على اختيار جهازك بثقة',
    cards: [['⇄','المقارنة','قارن بين الأجهزة'],['⌖','فحص الجهاز','قبل إتمام الشراء'],['▯','قيمة الهاتف','اعرف السعر المناسب']],
    value: 'كم تبلغ قيمة هاتفك؟', valueText: 'قارن سعر جهازك بأسعار الأجهزة المشابهة المعروضة في السوق قبل البيع أو الشراء.', action: 'اعرف سعر هاتفك',
    videos: 'دليل سريع', best: 'أجهزة مقترحة', tips: 'نصائح مهمة قبل الشراء',
    guideNames: ['كيف تفحص الهاتف قبل الشراء؟','كيف تتحقق من البطارية؟','خطوات شراء آمن'],
    items: ['افحص الشاشة واللمس في جميع أطرافها.','اختبر الكاميرات والسماعات والميكروفون ومنفذ الشحن.','تحقق من رقم IMEI وحالة الجهاز قبل الدفع.','قابل البائع في مكان عام ولا تحوّل مبالغ مقدماً.'],
    empty: 'ستظهر الأجهزة المقترحة هنا عند توفر الإعلانات.'
  },
  en: {
    title: 'Guidance', subtitle: 'Tools and advice to help you choose with confidence',
    cards: [['⇄','Compare','Compare devices'],['⌖','Inspect device','Before you buy'],['▯','Phone value','Know a fair price']],
    value: 'What is your phone worth?', valueText: 'Compare your device with similar listings before you buy or sell.', action: 'Check phone prices',
    videos: 'Quick guide', best: 'Suggested devices', tips: 'Important tips before buying',
    guideNames: ['Inspect a phone before buying','Check battery health','Safe buying steps'],
    items: ['Test the full screen and touch response.','Check cameras, speakers, microphone and charging port.','Verify the IMEI and device condition before payment.','Meet in public and never transfer money in advance.'],
    empty: 'Suggested devices will appear here when listings are available.'
  },
  ku: {
    title: 'ڕێنمایی', subtitle: 'ئامراز و زانیاری بۆ هەڵبژاردنی ئامێر بە دڵنیایی',
    cards: [['⇄','بەراورد','ئامێرەکان بەراورد بکە'],['⌖','پشکنینی ئامێر','پێش کڕین'],['▯','نرخی مۆبایل','نرخی گونجاو بزانە']],
    value: 'نرخی مۆبایلەکەت چەندە؟', valueText: 'ئامێرەکەت بە ئامێری هاوشێوە بەراورد بکە پێش کڕین یان فرۆشتن.', action: 'بینینی نرخی مۆبایل',
    videos: 'ڕێنمایی خێرا', best: 'ئامێری پێشنیارکراو', tips: 'ئامۆژگاری پێش کڕین',
    guideNames: ['پشکنینی مۆبایل پێش کڕین','پشکنینی تەندروستی باتری','هەنگاوەکانی کڕینی سەلامەت'],
    items: ['شاشە و تاچ لە هەموو لایەکەوە بپشکنە.','کامێرا و سپیکەر و مایک و دەرچەی شارژ تاقی بکەرەوە.','IMEI و دۆخی ئامێر پێش پارەدان بپشکنە.','لە شوێنی گشتی ببینەوە و پارە پێشەکی مەگوازەرەوە.'],
    empty: 'ئامێرە پێشنیارکراوەکان لێرە دەردەکەون.'
  }
};

function firstImage(item) {
  return [...(item?.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];
}

export default function GuidanceScreen({ onBrowse, onOpen, lang = 'ar' }) {
  const t = T[lang] || T.ar;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.from('listings')
      .select('id,title,price,currency,governorate,city,brand,listing_images(storage_path,sort_order)')
      .eq('status', 'active').order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => { if (alive) { setItems(data || []); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const openBrowse = () => onBrowse?.();

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.heading}>{t.title}</Text>
      <Text style={s.subtitle}>{t.subtitle}</Text>

      <View style={s.tools}>
        {t.cards.map(([icon, title, body], index) => (
          <Pressable key={title} style={s.toolCard} onPress={openBrowse}>
            <Text style={s.toolIcon}>{icon}</Text>
            <Text style={s.toolTitle}>{title}</Text>
            <Text style={s.toolBody}>{body}</Text>
            {index === 1 ? <View style={s.newTag}><Text style={s.newTagText}>جديد</Text></View> : null}
          </Pressable>
        ))}
      </View>

      <View style={s.valueCard}>
        <Text style={s.valueTitle}>{t.value}</Text>
        <Text style={s.valueBody}>{t.valueText}</Text>
        <Pressable style={s.valueButton} onPress={openBrowse}>
          <Text style={s.valueButtonText}>{t.action}  ←</Text>
        </Pressable>
      </View>

      <View style={s.sectionHeading}>
        <Text style={s.sectionTitle}>{t.videos}</Text>
        <Text style={s.sectionHint}>SUPER PHONE</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.guideStrip}>
        {t.guideNames.map((name, index) => {
          const item = items[index];
          const photo = firstImage(item);
          return (
            <Pressable key={name} style={s.guideCard} onPress={openBrowse}>
              {photo ? <Image source={{ uri: imageUrl(photo.storage_path) }} style={s.guideImage} resizeMode="cover" /> :
                <View style={[s.guideImage, s.guideFallback]}><Text style={s.guideFallbackIcon}>▯</Text></View>}
              <View style={s.play}><Text style={s.playText}>▶</Text></View>
              <Text style={s.guideTitle} numberOfLines={2}>{name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.sectionHeading}>
        <Text style={s.sectionTitle}>{t.best}</Text>
        <Text style={s.sectionHint}>{items.length}</Text>
      </View>
      {loading ? <ActivityIndicator color="#C8102E" style={{ margin: 22 }} /> : items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.productStrip}>
          {items.slice(0, 6).map((item) => {
            const photo = firstImage(item);
            return (
              <Pressable key={item.id} style={s.productCard} onPress={() => onOpen?.(item.id)}>
                {photo ? <Image source={{ uri: imageUrl(photo.storage_path) }} style={s.productImage} resizeMode="cover" /> :
                  <View style={[s.productImage, s.guideFallback]}><Text style={s.guideFallbackIcon}>▯</Text></View>}
                <Text style={s.productTitle} numberOfLines={1}>{item.brand || item.title}</Text>
                <Text style={s.productPrice}>{formatPrice(item.price, item.currency)}</Text>
                <Text style={s.productLocation}>{governorateLabel(lang, item.governorate)}{item.city ? ' · ' + item.city : ''}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : <Text style={s.empty}>{t.empty}</Text>}

      <Text style={s.sectionTitleStandalone}>{t.tips}</Text>
      {t.items.map((item, index) => (
        <View key={item} style={s.tipRow}>
          <Text style={s.tipNumber}>{String(index + 1).padStart(2, '0')}</Text>
          <Text style={s.tipText}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingBottom: 28 },
  heading: { color: '#333333', fontSize: 27, fontWeight: '900', textAlign: 'right', marginTop: 24, marginHorizontal: 18 },
  subtitle: { color: '#777777', fontSize: 14, textAlign: 'right', marginHorizontal: 18, marginTop: 7, marginBottom: 18 },
  tools: { flexDirection: 'row-reverse', gap: 9, paddingHorizontal: 15 },
  toolCard: { flex: 1, minHeight: 118, padding: 10, borderRadius: 11, borderWidth: 1, borderColor: '#e6e6e6', backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  toolIcon: { color: '#454545', fontSize: 29, marginBottom: 7 },
  toolTitle: { color: '#444444', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  toolBody: { color: '#888888', fontSize: 10, textAlign: 'center', marginTop: 5, lineHeight: 15 },
  newTag: { position: 'absolute', left: 8, top: 8, backgroundColor: '#C8102E', borderRadius: 18, paddingHorizontal: 9, paddingVertical: 4 },
  newTagText: { color: '#ffffff', fontWeight: '900', fontSize: 10 },
  valueCard: { marginHorizontal: 16, marginTop: 18, borderRadius: 13, backgroundColor: '#C8102E', padding: 19, minHeight: 178 },
  valueTitle: { color: '#ffffff', textAlign: 'right', fontSize: 23, fontWeight: '900' },
  valueBody: { color: '#e7f2fb', textAlign: 'right', marginTop: 7, fontSize: 14, lineHeight: 23 },
  valueButton: { marginTop: 14, backgroundColor: '#ffffff', borderRadius: 9, alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: 16 },
  valueButtonText: { color: '#C8102E', fontSize: 15, fontWeight: '900' },
  sectionHeading: { paddingHorizontal: 18, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 27, marginBottom: 12 },
  sectionTitle: { color: '#444444', fontSize: 18, fontWeight: '900', textAlign: 'right' },
  sectionHint: { color: '#999999', fontSize: 12 },
  guideStrip: { paddingHorizontal: 12, gap: 9, flexDirection: 'row-reverse' },
  guideCard: { width: 160, height: 188, borderRadius: 9, overflow: 'hidden', backgroundColor: '#f4f4f4', position: 'relative' },
  guideImage: { width: '100%', height: 122, backgroundColor: '#f0f0f0' },
  guideFallback: { alignItems: 'center', justifyContent: 'center' },
  guideFallbackIcon: { color: '#C8102E', fontSize: 48 },
  play: { position: 'absolute', top: 42, alignSelf: 'center', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.58)', alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#ffffff', fontSize: 17, marginLeft: 3 },
  guideTitle: { color: '#444444', fontSize: 12, fontWeight: '800', textAlign: 'right', padding: 8, lineHeight: 18 },
  productStrip: { paddingHorizontal: 12, gap: 10, flexDirection: 'row-reverse' },
  productCard: { width: 170, borderWidth: 1, borderColor: '#e2e2e2', borderRadius: 9, backgroundColor: '#ffffff', overflow: 'hidden' },
  productImage: { width: '100%', height: 106, backgroundColor: '#f2f2f2' },
  productTitle: { color: '#444444', fontSize: 13, fontWeight: '800', textAlign: 'right', paddingHorizontal: 8, paddingTop: 7 },
  productPrice: { color: '#C8102E', fontSize: 14, fontWeight: '900', textAlign: 'right', paddingHorizontal: 8, paddingTop: 4 },
  productLocation: { color: '#888888', fontSize: 10, textAlign: 'right', paddingHorizontal: 8, paddingVertical: 6 },
  empty: { color: '#888888', textAlign: 'center', padding: 20, fontSize: 13 },
  sectionTitleStandalone: { color: '#444444', fontSize: 18, fontWeight: '900', textAlign: 'right', marginHorizontal: 18, marginTop: 25, marginBottom: 8 },
  tipRow: { marginHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#eeeeee', flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  tipNumber: { color: '#C8102E', fontSize: 17, fontWeight: '900', width: 32 },
  tipText: { color: '#555555', flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 21 }
});
