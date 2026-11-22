import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/constants';

const BASE = 'https://superphone-orvexdcb.vercel.app';
const ITEMS = [
  { title: 'مراجعة الإعلانات', desc: 'مراجعة الإعلانات الجديدة وقبولها أو رفضها', path: '/admin/listings', icon: '▣' },
  { title: 'إدارة البلاغات', desc: 'متابعة بلاغات المستخدمين', path: '/admin/reports', icon: '⚑' },
  { title: 'لوحة إعدادات المؤسس على الويب', desc: 'فتح مركز أدوات المؤسس الكامل', path: '/founder/settings', icon: '⚙' },
];

export default function FounderSettingsScreen() {
  const { user } = useAuth();
  const [access, setAccess] = useState('checking');

  useEffect(() => {
    let active = true;
    async function verifyFounder() {
      if (!user?.id) {
        if (active) setAccess('denied');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (active) setAccess(!error && data?.role === 'admin' ? 'allowed' : 'denied');
    }
    verifyFounder();
    return () => { active = false; };
  }, [user?.id]);

  if (access !== 'allowed') {
    return <View style={s.restricted}>
      <Text style={s.title}>{access === 'checking' ? 'جارٍ التحقق من الصلاحية…' : 'هذه الصفحة خاصة بحساب المؤسس'}</Text>
      {access === 'denied' && <Text style={s.note}>لا يمكن عرض أدوات الإدارة لهذا الحساب.</Text>}
    </View>;
  }

  return <ScrollView contentContainerStyle={s.wrap}>
    <View style={s.hero}><Text style={s.kicker}>SUPER PHONE · FOUNDER</Text><Text style={s.title}>إعدادات البرنامج الكاملة</Text><Text style={s.sub}>مركز أدوات المؤسس وإدارة المنصة</Text></View>
    <Text style={s.section}>أدوات الإدارة</Text>
    {ITEMS.map(item=><Pressable key={item.path} style={s.card} onPress={()=>Linking.openURL(BASE+item.path)}>
      <Text style={s.icon}>{item.icon}</Text><View style={s.copy}><Text style={s.name}>{item.title}</Text><Text style={s.desc}>{item.desc}</Text></View><Text style={s.arrow}>←</Text>
    </Pressable>)}
    <Text style={s.note}>هذه الأدوات محمية بصلاحية المؤسس. عند فتح أدوات الإدارة على الويب قد يُطلب تسجيل الدخول إذا لم تكن جلسة المتصفح نشطة.</Text>
  </ScrollView>;
}
const s=StyleSheet.create({
restricted:{flex:1,justifyContent:'center',alignItems:'center',padding:24,gap:10},wrap:{padding:16,gap:12},hero:{backgroundColor:'#C8102E',borderRadius:18,padding:20,gap:8},kicker:{color:COLORS.gold,fontSize:10,fontWeight:'900',letterSpacing:2},title:{color:COLORS.goldLight,fontSize:22,fontWeight:'900',textAlign:'right'},sub:{color:'#d2dbe6',fontSize:13,textAlign:'right'},section:{color:COLORS.text,fontWeight:'900',fontSize:17,textAlign:'right',marginTop:8},card:{backgroundColor:COLORS.panel,borderColor:COLORS.border,borderWidth:1,borderRadius:14,padding:15,flexDirection:'row-reverse',alignItems:'center',gap:12},icon:{width:42,height:42,textAlign:'center',textAlignVertical:'center',overflow:'hidden',borderRadius:12,backgroundColor:'#f7f0e2',color:'#a77b32',fontSize:22},copy:{flex:1,gap:4},name:{color:COLORS.text,fontWeight:'800',textAlign:'right'},desc:{color:COLORS.muted,fontSize:12,textAlign:'right'},arrow:{color:COLORS.gold,fontSize:20},note:{color:COLORS.muted,fontSize:12,lineHeight:20,textAlign:'right',marginTop:6}
});
