import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/constants';
import BrowseScreen from './BrowseScreen';

export default function StoreScreen({ lang = 'ar', onOpen, onSell, onFavorites }) {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    supabase.from('categories').select('slug,name_ar').eq('is_active', true).then(({ data }) => {
      if (!alive) return;
      const match = (data || []).find((item) => /إكسسوارات|اكسسوارات|ملحقات|Accessories/i.test(item.name_ar || ''));
      setCategory(match?.slug || null);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);
  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.gold} /></View>;
  if (!category) return <View style={styles.center}><Text style={styles.title}>متجر ملحقات الهواتف</Text><Text style={styles.note}>سيظهر هذا القسم عند تفعيل تصنيف الإكسسوارات في إعدادات التصنيفات.</Text></View>;
  return <BrowseScreen lang={lang} fixedCategorySlug={category} onOpen={onOpen} onSell={onSell} onFavorites={onFavorites} />;
}
const styles = StyleSheet.create({ center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:COLORS.bg},title:{fontSize:22,fontWeight:'900',color:COLORS.gold,textAlign:'center'},note:{fontSize:15,color:COLORS.muted,textAlign:'center',lineHeight:24,marginTop:12} });
