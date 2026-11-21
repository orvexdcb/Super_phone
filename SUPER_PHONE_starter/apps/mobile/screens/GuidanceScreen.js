import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const T = {
  ar: {
    title: 'إرشاد', subtitle: 'كل ما يساعدك على اختيار جهازك بثقة',
    cards: [['⇄','مقارنة الأجهزة','قارن المواصفات والأسعار قبل الشراء.'],['▯','دليل اختيار الهاتف','اختر الحجم والذاكرة والبطارية التي تناسبك.'],['✓','فحص الجهاز','تأكد من الشاشة والبطارية والكاميرات ورقم IMEI.']],
    value: 'كم يستحق هاتفك؟', valueText: 'راجع أسعار الأجهزة المشابهة المعروضة في السوق قبل الاتفاق مع البائع أو المشتري.', action: 'تصفح أسعار الأجهزة',
    tips: 'نصائح مهمة قبل الشراء', items: ['افحص الشاشة واللمس في جميع أطرافها.','اختبر الكاميرات والسماعات والميكروفون والشحن.','تحقق من رقم IMEI وحالة الجهاز قبل الدفع.','قابل البائع في مكان عام ولا تحول المال مقدماً.']
  },
  en: {
    title: 'Guidance', subtitle: 'Helpful advice for choosing your next device',
    cards: [['⇄','Compare devices','Compare specifications and prices before buying.'],['▯','Phone buying guide','Choose the size, memory and battery that suit you.'],['✓','Device inspection','Check the display, battery, cameras and IMEI.']],
    value: 'What is your phone worth?', valueText: 'Review similar devices listed in the marketplace before agreeing on a price.', action: 'Browse device prices',
    tips: 'Important tips before buying', items: ['Test the full screen and touch response.','Check cameras, speakers, microphone and charging.','Verify the IMEI and device condition before payment.','Meet in public and never transfer money in advance.']
  },
  ku: {
    title: 'ڕێنمایی', subtitle: 'زانیاری بۆ هەڵبژاردنی ئامێرێکی گونجاو',
    cards: [['⇄','بەراوردی ئامێرەکان','تایبەتمەندی و نرخەکان بەراورد بکە.'],['▯','ڕێنمایی کڕینی مۆبایل','قەبارە و بیرگە و باتریی گونجاو هەڵبژێرە.'],['✓','پشکنینی ئامێر','شاشە و باتری و کامێرا و IMEI بپشکنە.']],
    value: 'نرخی مۆبایلەکەت چەندە؟', valueText: 'نرخی ئامێرە هاوشێوەکان لە بازاڕدا ببینە پێش ڕێککەوتن.', action: 'بینینی نرخەکان',
    tips: 'ئامۆژگاری پێش کڕین', items: ['شاشە و تاچ لە هەموو لایەکەوە بپشکنە.','کامێرا و سپیکەر و مایک و شارژ تاقی بکەرەوە.','IMEI و دۆخی ئامێر پێش پارەدان بپشکنە.','لە شوێنی گشتی ببینەوە و پارە پێشەکی مەگوازەرەوە.']
  }
};

export default function GuidanceScreen({ onBrowse }) {
  const t = T.ar;
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.heading}>{t.title}</Text>
      <Text style={s.subtitle}>{t.subtitle}</Text>

      <View style={s.tools}>
        {t.cards.map(([icon, title, body]) => (
          <View key={title} style={s.toolCard}>
            <Text style={s.toolIcon}>{icon}</Text>
            <Text style={s.toolTitle}>{title}</Text>
            <Text style={s.toolBody}>{body}</Text>
          </View>
        ))}
      </View>

      <View style={s.valueCard}>
        <Text style={s.valueTitle}>{t.value}</Text>
        <Text style={s.valueBody}>{t.valueText}</Text>
        <Pressable style={s.valueButton} onPress={onBrowse}>
          <Text style={s.valueButtonText}>{t.action}  ←</Text>
        </Pressable>
      </View>

      <Text style={s.sectionTitle}>{t.tips}</Text>
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
  toolCard: { flex: 1, minHeight: 145, padding: 10, borderRadius: 11, borderWidth: 1, borderColor: '#e6e6e6', backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  toolIcon: { color: '#e84b53', fontSize: 30, marginBottom: 7 },
  toolTitle: { color: '#444444', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  toolBody: { color: '#888888', fontSize: 10, textAlign: 'center', marginTop: 5, lineHeight: 15 },
  valueCard: { marginHorizontal: 16, marginTop: 18, borderRadius: 14, backgroundColor: '#15558c', padding: 19 },
  valueTitle: { color: '#ffffff', textAlign: 'right', fontSize: 23, fontWeight: '900' },
  valueBody: { color: '#e7f2fb', textAlign: 'right', marginTop: 7, fontSize: 14, lineHeight: 23 },
  valueButton: { marginTop: 14, backgroundColor: '#ffffff', borderRadius: 9, alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: 16 },
  valueButtonText: { color: '#15558c', fontSize: 15, fontWeight: '900' },
  sectionTitle: { color: '#444444', fontSize: 18, fontWeight: '900', textAlign: 'right', marginHorizontal: 18, marginTop: 25, marginBottom: 8 },
  tipRow: { marginHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#eeeeee', flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  tipNumber: { color: '#e84b53', fontSize: 17, fontWeight: '900', width: 32 },
  tipText: { color: '#555555', flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 21 }
});
