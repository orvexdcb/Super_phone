import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/constants';
import AuthScreen from './AuthScreen';
import { tr } from '../lib/i18n';

const QUICK = [
  { icon: '▣', title: 'نشر هاتف', hint: 'اعرض هاتفك للبيع', route: 'new' },
  { icon: '▤', title: 'إعلاناتي', hint: 'إدارة الهواتف المعروضة', route: 'mine' },
  { icon: '♡', title: 'المفضلة', hint: 'الهواتف المحفوظة', route: 'favorites' },
  { icon: '⌕', title: 'البحث', hint: 'اعثر على هاتف مناسب', tab: 'home' },
  { icon: '◇', title: 'إرشاد', hint: 'نصائح قبل شراء الهاتف', tab: 'guide' },
  { icon: '▦', title: 'متجر الهواتف', hint: 'تصفح الملحقات والعروض', tab: 'store' },
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
      <View style={s.headingRow}>
        <View style={s.brandMark}><Text style={s.brandIcon}>▣</Text></View>
        <View style={s.headingCopy}>
          <Text style={s.kicker}>SUPER PHONE</Text>
          <Text style={s.heading}>{t('account')}</Text>
        </View>
      </View>

      <View style={s.profile}>
        <View style={s.avatar}><Text style={s.avatarText}>{(user.email || 'S').slice(0,1).toUpperCase()}</Text></View>
        <View style={s.profileCopy}>
          <Text style={s.profileTitle}>حسابي</Text>
          <Text style={s.email}>{user.email}</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>اختصارات الحساب</Text>
      <View style={s.grid}>
        {QUICK.map(item => (
          <Pressable key={item.title} style={({pressed}) => [s.tile, pressed && s.pressed]} onPress={() => open(item)}>
            <Text style={s.tileIcon}>{item.icon}</Text>
            <Text style={s.tileTitle}>{item.title}</Text>
            <Text style={s.tileHint}>{item.hint}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.sectionTitle}>إعدادات الحساب</Text>
      {isFounder && (
        <Pressable style={s.row} onPress={() => onNavigate?.({ name: 'founder-settings' })}>
          <Text style={s.rowIcon}>⚙</Text>
          <View style={s.rowCopy}>
            <Text style={s.rowTitle}>إعدادات البرنامج الكاملة</Text>
            <Text style={s.rowHint}>أدوات المؤسس وإدارة المنصة</Text>
          </View>
          <Text style={s.chevron}>‹</Text>
        </Pressable>
      )}
      <Pressable style={s.row} onPress={() => supabase.auth.signOut()}>
        <Text style={[s.rowIcon, {color:COLORS.danger}]}>⇥</Text>
        <View style={s.rowCopy}><Text style={[s.rowTitle,{color:COLORS.danger}]}>{t('logout')}</Text><Text style={s.rowHint}>تسجيل الخروج من حسابك</Text></View>
        <Text style={s.chevron}>‹</Text>
      </Pressable>
      <Text style={s.footer}>سوبر فون · سوق الهواتف والإكسسوارات</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page:{flex:1,backgroundColor:COLORS.bg},
  content:{paddingHorizontal:18,paddingTop:20,paddingBottom:28,gap:16},
  headingRow:{flexDirection:'row-reverse',alignItems:'center',gap:13,marginBottom:4},
  brandMark:{width:54,height:54,borderRadius:15,backgroundColor:COLORS.panel,borderWidth:1.5,borderColor:COLORS.gold,alignItems:'center',justifyContent:'center'},
  brandIcon:{fontSize:29,color:COLORS.gold,fontWeight:'900'},
  headingCopy:{flex:1,alignItems:'flex-end',gap:1},
  kicker:{fontSize:11,fontWeight:'900',letterSpacing:2,color:COLORS.gold},
  heading:{fontSize:27,fontWeight:'900',color:COLORS.text,textAlign:'right'},
  profile:{backgroundColor:COLORS.panel,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:15,flexDirection:'row-reverse',alignItems:'center',gap:12},
  avatar:{width:48,height:48,borderRadius:24,backgroundColor:'#263a53',borderWidth:1,borderColor:COLORS.gold,alignItems:'center',justifyContent:'center'},
  avatarText:{fontSize:21,fontWeight:'900',color:COLORS.gold},
  profileCopy:{flex:1,alignItems:'flex-end',gap:4},
  profileTitle:{fontSize:17,fontWeight:'900',color:COLORS.text},
  email:{fontSize:12,color:COLORS.muted},
  sectionTitle:{fontSize:17,fontWeight:'900',color:COLORS.text,textAlign:'right',marginTop:3},
  grid:{flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'space-between',gap:10},
  tile:{width:'31.5%',minHeight:116,paddingVertical:13,paddingHorizontal:5,backgroundColor:COLORS.panel,borderWidth:1,borderColor:COLORS.border,borderRadius:12,alignItems:'center',justifyContent:'center',gap:5},
  pressed:{opacity:0.72,transform:[{scale:0.98}]},
  tileIcon:{fontSize:27,color:COLORS.gold,height:34,textAlign:'center'},
  tileTitle:{fontSize:13,fontWeight:'800',color:COLORS.text,textAlign:'center'},
  tileHint:{fontSize:9,color:COLORS.muted,textAlign:'center'},
  row:{minHeight:76,flexDirection:'row-reverse',alignItems:'center',gap:13,paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:COLORS.border},
  rowIcon:{fontSize:27,color:COLORS.gold,width:35,textAlign:'center'},
  rowCopy:{flex:1,alignItems:'flex-end',gap:4},
  rowTitle:{fontSize:16,fontWeight:'800',color:COLORS.text,textAlign:'right'},
  rowHint:{fontSize:11,color:COLORS.muted,textAlign:'right'},
  chevron:{fontSize:26,color:COLORS.gold},
  footer:{fontSize:11,color:COLORS.muted,textAlign:'center',marginTop:8},
});
