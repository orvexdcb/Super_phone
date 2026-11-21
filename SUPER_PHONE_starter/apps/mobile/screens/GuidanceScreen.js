import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { COLORS } from '../lib/constants';

const ITEMS = [
  ['مقارنة الهواتف','قارن المواصفات الأساسية قبل اتخاذ قرار الشراء.'],
  ['دليل اختيار الهاتف','حدد ميزانيتك واستخدامك واختر الجهاز المناسب.'],
  ['نصائح قبل الشراء','افحص الشاشة والبطارية والكاميرات والشبكة ورقم IMEI قبل الدفع.'],
  ['تقدير السعر','قارن أسعار الأجهزة المشابهة المعروضة في السوق قبل الاتفاق.'],
];
export default function GuidanceScreen() {
 return <ScrollView style={s.page} contentContainerStyle={s.content}>
  <Text style={s.heading}>إرشاد</Text>
  <Text style={s.sub}>أدوات ومعلومات تساعدك على اختيار هاتفك بثقة</Text>
  {ITEMS.map(([title,body],i)=><View key={title} style={s.card}><Text style={s.number}>0{i+1}</Text><View style={{flex:1}}><Text style={s.title}>{title}</Text><Text style={s.body}>{body}</Text></View></View>)}
 </ScrollView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:COLORS.bg},content:{padding:18,gap:14},heading:{fontSize:28,fontWeight:'900',color:COLORS.gold,textAlign:'right'},sub:{fontSize:14,color:COLORS.muted,textAlign:'right',marginBottom:8},card:{backgroundColor:COLORS.panel,borderColor:COLORS.border,borderWidth:1,borderRadius:16,padding:18,flexDirection:'row-reverse',alignItems:'center',gap:14},number:{fontSize:22,fontWeight:'900',color:COLORS.gold},title:{fontSize:18,fontWeight:'800',color:COLORS.text,textAlign:'right'},body:{fontSize:13,color:COLORS.muted,textAlign:'right',lineHeight:22,marginTop:5}});
