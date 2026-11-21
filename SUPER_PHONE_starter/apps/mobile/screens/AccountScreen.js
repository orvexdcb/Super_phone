import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import AuthScreen from './AuthScreen';
import { tr } from '../lib/i18n';

const QUICK = [
  { icon: '▯', title: 'نشر إعلان جديد', hint: 'اعرض هاتفك أو جهازك للبيع', route: 'new' },
  { icon: '▤', title: 'إعلاناتي', hint: 'إدارة الأجهزة التي عرضتها', route: 'mine' },
  { icon: '♡', title: 'المفضلة', hint: 'الأجهزة التي حفظتها', route: 'favorites' },
  { icon: '⌕', title: 'البحث', hint: 'اعثر على جهاز مناسب', tab: 'home' },
  { icon: '◎', title: 'إرشاد', hint: 'نصائح قبل شراء الهاتف', tab: 'guide' },
  { icon: '▣', title: 'المتجر', hint: 'تصفح فئات الأجهزة', tab: 'store' },
];

export default function AccountScreen({ onNavigate, onTab, lang = 'ar' }) {
  const t = (key) => tr(lang, key);
  const { user } = useAuth();
  const [isFounder, setIsFounder] = useState(false);

  useEffect(() => {
    let active = true;
    if (user?.id) {
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        .then(({ data }) => { if (active) setIsFounder(data?.role === 'admin'); });
    } else setIsFounder(false);
    return () => { active = false; };
  }, [user?.id]);

  if (!user) return <AuthScreen lang={lang} />;

  const open = (item) => {
    if (item.route) onNavigate?.({ name: item.route });
    else if (item.tab) onTab?.(item.tab);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.heading}>{t('account')}</Text>
      <View style={s.profile}>
        <View style={s.avatar}><Text style={s.avatarText}>{(user.email || 'S').slice(0, 1).toUpperCase()}</Text></View>
        <View style={s.profileCopy}>
          <Text style={s.profileTitle}>حسابي</Text>
          <Text style={s.email}>{user.email}</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>خدمات الحساب</Text>
      <View style={s.grid}>
        {QUICK.map((item) => (
          <Pressable key={item.title} style={({ pressed }) => [s.tile, pressed && s.pressed]} onPress={() => open(item)}>
            <Text style={s.tileIcon}>{item.icon}</Text>
            <Text style={s.tileTitle}>{item.title}</Text>
            <Text style={s.tileHint}>{item.hint}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.sectionTitle}>الإعدادات</Text>
      {isFounder && (
        <Pressable style={s.row} onPress={() => onNavigate?.({ name: 'founder-settings' })}>
          <Text style={s.rowIcon}>⚙</Text>
          <View style={s.rowCopy}>
            <Text style={s.rowTitle}>إعدادات البرنامج الكاملة</Text>
            <Text style={s.rowHint}>إدارة المنصة وأدوات المؤسس</Text>
          </View>
          <Text style={s.chevron}>‹</Text>
        </Pressable>
      )}
      <Pressable style={s.row} onPress={() => supabase.auth.signOut()}>
        <Text style={[s.rowIcon, { color: '#e84b53' }]}>⇥</Text>
        <View style={s.rowCopy}>
          <Text style={[s.rowTitle, { color: '#e84b53' }]}>{t('logout')}</Text>
          <Text style={s.rowHint}>تسجيل الخروج من حسابك</Text>
        </View>
        <Text style={s.chevron}>‹</Text>
      </Pressable>
      <Text style={s.footer}>SUPER PHONE · سوق الهواتف والأجهزة الذكية</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 30, gap: 16 },
  heading: { fontSize: 27, fontWeight: '900', color: '#333333', textAlign: 'right', marginBottom: 4 },
  profile: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e4e4e4', borderRadius: 13, padding: 15, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff0f0', borderWidth: 1, borderColor: '#e84b53', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 21, fontWeight: '900', color: '#e84b53' },
  profileCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  profileTitle: { fontSize: 17, fontWeight: '900', color: '#333333' },
  email: { fontSize: 12, color: '#777777' },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: '#414141', textAlign: 'right', marginTop: 3 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', gap: 9 },
  tile: { width: '31.5%', minHeight: 116, paddingVertical: 13, paddingHorizontal: 5, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 5 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  tileIcon: { fontSize: 28, color: '#e84b53', height: 34, textAlign: 'center' },
  tileTitle: { fontSize: 12, fontWeight: '900', color: '#3d3d3d', textAlign: 'center' },
  tileHint: { fontSize: 9, color: '#888888', textAlign: 'center' },
  row: { minHeight: 76, flexDirection: 'row-reverse', alignItems: 'center', gap: 13, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eeeeee' },
  rowIcon: { fontSize: 26, color: '#e84b53', width: 35, textAlign: 'center' },
  rowCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '800', color: '#404040', textAlign: 'right' },
  rowHint: { fontSize: 11, color: '#888888', textAlign: 'right' },
  chevron: { fontSize: 26, color: '#e84b53' },
  footer: { fontSize: 11, color: '#999999', textAlign: 'center', marginTop: 8 }
});
