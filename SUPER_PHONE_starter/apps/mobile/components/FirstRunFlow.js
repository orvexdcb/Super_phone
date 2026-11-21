import React, {useEffect,useState} from 'react';
import {Image,Pressable,ScrollView,StyleSheet,Text,View,ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StatusBar} from 'expo-status-bar';
import {COLORS,GOVERNORATES,IRAQ_DISTRICTS} from '../lib/constants';
import { governorateLabel, districtLabel } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import * as Location from 'expo-location';
const KEY='superphone:first-run:v1';
const T={
ar:{language:'اختر اللغة',place:'أين تسكن؟',governorate:'المحافظة',area:'المدينة / المنطقة',gps:'تحديد موقعي',next:'التالي',skip:'تخطي',start:'ابدأ الاستخدام',intro:['زر بيع هاتفك يتيح لك عرض جهازك للبيع مع الصور والسعر.','زر البحث يساعدك في العثور على الجهاز الذي تريده.','المفضلة تحفظ الأجهزة التي تريد العودة إليها.','الأزرار الرئيسية موجودة في الشريط السفلي.'],hint:'يمكنك السماح بالوصول للموقع أو اختيار المنطقة يدوياً.'},
en:{language:'Choose your language',place:'Where do you live?',governorate:'Governorate',area:'City / area',gps:'Use my location',next:'Next',skip:'Skip',start:'Start using the app',intro:['Sell your phone lets you publish your device with photos and a price.','Search helps you find the device you need.','Favorites saves devices for later.','Main actions are available in the bottom navigation.'],hint:'You can allow location access or choose your area manually.'},
ku:{language:'زمان هەڵبژێرە',place:'لە کوێ دەژیت؟',governorate:'پارێزگا',area:'شار / ناوچە',gps:'شوێنەکەم دیاری بکە',next:'دواتر',skip:'تێپەڕاندن',start:'دەستپێبکە',intro:['فرۆشتنی مۆبایل بۆ بڵاوکردنەوەی ئامێرەکەتە.','گەڕان بۆ دۆزینەوەی ئامێری دڵخوازە.','دڵخوازەکان ئامێرەکانت دەپارێزێت.','دوگمە سەرەکییەکان لە خوارەوەی شاشەکەن.'],hint:'دەتوانیت مۆڵەتی شوێن بدەیت یان ناوچەکە بە دەستی هەڵبژێریت.'}
};
export default function FirstRunFlow({children,onComplete}){
 const {user}=useAuth();
 const [loading,setLoading]=useState(true),[done,setDone]=useState(false),[step,setStep]=useState(0),[lang,setLang]=useState('ar'),[gov,setGov]=useState(''),[area,setArea]=useState(''),[gps,setGps]=useState('');
 useEffect(()=>{AsyncStorage.getItem(KEY).then(raw=>{if(raw){try{const saved=JSON.parse(raw);setLang(['ar','en','ku'].includes(saved.lang)?saved.lang:'ar');setDone(true)}catch{}}}).finally(()=>setLoading(false))},[]);
 useEffect(()=>{if(!done||!user?.id)return;AsyncStorage.getItem(KEY).then(async raw=>{if(!raw)return;try{const saved=JSON.parse(raw);if(!saved.governorate)return;const {data:profile}=await supabase.from('profiles').select('governorate').eq('id',user.id).maybeSingle();if(profile&&!profile.governorate)await supabase.from('profiles').update({governorate:saved.governorate,city:saved.area||null}).eq('id',user.id)}catch{}})},[done,user?.id]);
 if(loading)return <View style={s.splash}><StatusBar style="dark"/><ActivityIndicator color="#e84b53"/></View>;
 if(done)return children;
 const t=T[lang];
 const finish=async()=>{await AsyncStorage.setItem(KEY,JSON.stringify({lang,governorate:gov,area,completed:true}));try{const {data:{user}}=await supabase.auth.getUser();if(user&&gov)await supabase.from('profiles').update({governorate:gov,city:area.trim()||null}).eq('id',user.id)}catch{}setDone(true);onComplete?.(lang)};
 const requestLocation=async()=>{try{const permission=await Location.requestForegroundPermissionsAsync();if(!permission.granted){setGps(t.hint);return;}await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});setGps(t.hint)}catch{setGps(t.hint)}};
 return <View style={s.root}><StatusBar style="dark"/>
 {step===0?<View style={s.splash}><Image source={require('../assets/icon.png')} style={s.logo} resizeMode="contain"/><Text style={s.brand}>SUPER PHONE</Text><Text style={s.welcome}>سوق الهواتف والأجهزة الذكية</Text><Pressable onPress={()=>setStep(1)} style={s.btn}><Text style={s.btnText}>{t.next}</Text></Pressable></View>:
 step===1?<View style={s.panel}><Text style={s.title}>{t.language}</Text>{[['en','English'],['ar','عربي'],['ku','کوردی']].map(([v,label])=><Pressable key={v} onPress={()=>setLang(v)} style={[s.option,lang===v&&s.selected]}><Text style={s.optionText}>{label}</Text></Pressable>)}<Pressable style={s.btn} onPress={()=>setStep(2)}><Text style={s.btnText}>{t.next}</Text></Pressable></View>:
 step===2?<ScrollView contentContainerStyle={s.locationPanel}><Text style={s.title}>{t.place}</Text><Text style={s.label}>{t.governorate}</Text><ScrollView style={s.govList}>{GOVERNORATES.map(g=><Pressable key={g} onPress={()=>{setGov(g);setArea('')}} style={[s.option,s.govOption,gov===g&&s.selected]}><Text style={s.optionText}>{governorateLabel(lang,g)}</Text></Pressable>)}</ScrollView><Text style={s.label}>{t.area}</Text><View style={s.areaList}>{(IRAQ_DISTRICTS[gov]||[]).map(d=><Pressable key={d} onPress={()=>setArea(d)} style={[s.option,s.areaOption,area===d&&s.selected]}><Text style={s.optionText}>{districtLabel(lang,d)}</Text></Pressable>)}</View><Pressable style={s.locationButton} onPress={requestLocation}><Text style={s.locationButtonText}>⌖  {t.gps}</Text></Pressable><Text style={s.hint}>{gps}</Text><Pressable style={[s.btn,(!gov||!area.trim())&&s.disabled]} disabled={!gov||!area.trim()} onPress={()=>setStep(3)}><Text style={s.btnText}>{t.next}</Text></Pressable></ScrollView>:
 <View style={s.panel}><Text style={s.title}>SUPER PHONE</Text><Text style={s.label}>{t.intro[step-3]}</Text><View style={s.row}><Pressable onPress={finish} style={s.skip}><Text style={s.skipText}>{t.skip}</Text></Pressable><Pressable style={s.btn} onPress={()=>step===6?finish():setStep(step+1)}><Text style={s.btnText}>{step===6?t.start:t.next}</Text></Pressable></View></View>}
 </View>;
}
const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#ffffff',justifyContent:'center',padding:22},
 splash:{flex:1,backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center'},
 logo:{width:170,height:170,marginBottom:14},
 brand:{color:'#303b54',fontSize:27,fontWeight:'900',letterSpacing:2},
 welcome:{color:'#777777',fontSize:13,marginTop:7},
 btn:{backgroundColor:'#e84b53',borderRadius:11,padding:14,alignItems:'center',flex:1,marginTop:16,minHeight:50,justifyContent:'center'},
 btnText:{color:'#ffffff',fontWeight:'900',fontSize:16},
 panel:{backgroundColor:'#ffffff',borderRadius:18,borderWidth:1,borderColor:'#e4e4e4',padding:20,gap:12},
 locationPanel:{backgroundColor:'#ffffff',padding:5,paddingBottom:28,gap:10},
 title:{color:'#303030',fontWeight:'900',fontSize:23,textAlign:'center',marginBottom:8},
 label:{color:'#555555',textAlign:'right',fontSize:17,fontWeight:'700',marginTop:3},
 option:{padding:14,borderRadius:12,borderWidth:1,borderColor:'#e0e0e0',backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center'},
 selected:{borderColor:'#e84b53',backgroundColor:'#fff7f7'},
 optionText:{color:'#444444',textAlign:'center',fontSize:17,fontWeight:'600'},
 govList:{maxHeight:165},
 govOption:{marginBottom:7},
 areaList:{flexDirection:'column',gap:7},
 areaOption:{width:'100%',minHeight:54},
 locationButton:{borderWidth:1,borderColor:'#e84b53',padding:12,borderRadius:10,alignItems:'center',marginTop:5},
 locationButtonText:{color:'#e84b53',fontWeight:'800',fontSize:15},
 hint:{color:'#888888',textAlign:'right',fontSize:12},
 disabled:{opacity:0.45},
 row:{flexDirection:'row',gap:10,alignItems:'stretch'},
 skip:{padding:14,justifyContent:'center'},
 skipText:{color:'#e84b53',fontWeight:'800'}
});
