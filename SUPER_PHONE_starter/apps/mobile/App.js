import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackHandler, Platform, Pressable, SafeAreaView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { COLORS } from './lib/constants';
import { supabase } from './lib/supabase';
import BrowseScreen from './screens/BrowseScreen';
import StoreScreen from './screens/StoreScreen';
import GuidanceScreen from './screens/GuidanceScreen';
import DetailScreen from './screens/DetailScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import AccountScreen from './screens/AccountScreen';
import FounderSettingsScreen from './screens/FounderSettingsScreen';
import NewListingScreen from './screens/NewListingScreen';
import MyListingsScreen from './screens/MyListingsScreen';
import FirstRunFlow from './components/FirstRunFlow';
import { tr } from './lib/i18n';

const TAB_LABELS = { ar: ['حسابي','المتجر','إرشاد','البداية'], en: ['Account','Store','Guide','Home'], ku: ['هەژمار','فرۆشگا','ڕێنمایی','سەرەکی'] };
const TAB_KEYS = ['account','store','guide','home'];
function TabIcon({ name, active }) {
  const color = active ? '#C8102E' : '#555555';
  if (name === 'account') {
    return <View style={iconStyles.frame}><View style={[iconStyles.personHead,{borderColor:color}]} /><View style={[iconStyles.personBody,{borderColor:color}]} /></View>;
  }
  if (name === 'store') {
    return <View style={iconStyles.frame}><View style={[iconStyles.bagHandle,{borderColor:color}]} /><View style={[iconStyles.bagBody,{borderColor:color}]} /></View>;
  }
  if (name === 'guide') {
    return <View style={iconStyles.frame}><View style={[iconStyles.guideRing,{borderColor:color,transform:[{rotate:'-42deg'}]}]} /><View style={[iconStyles.guideRing,{borderColor:color,transform:[{rotate:'42deg'}]}]} /></View>;
  }
  return <View style={iconStyles.frame}><Text style={{color,fontSize:28,lineHeight:29}}>⌂</Text></View>;
}


function Shell() {
  const { user } = useAuth();
  const [tab, setTab] = useState('home');
  const [route, setRoute] = useState(null);
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    AsyncStorage.getItem('superphone:first-run:v3').then((raw) => {
      if (raw) {
        try { setLang(JSON.parse(raw).lang || 'ar'); } catch {}
      }
    });
  }, []);

  const openDetail = (id) => setRoute({ name: 'detail', id });
  const goLogin = () => { setRoute(null); setTab('account'); };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route) { setRoute(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [route]);

  let body;
  if (route?.name === 'founder-settings') body = user ? <FounderSettingsScreen /> : <AccountScreen lang={lang} onNavigate={setRoute} onTab={setTab} />;
  else if (route?.name === 'favorites') body = user ? <FavoritesScreen lang={lang} onOpen={openDetail} /> : <AccountScreen lang={lang} onNavigate={setRoute} onTab={setTab} />;
  else if (route?.name === 'detail') body = <DetailScreen lang={lang} id={route.id} onNeedLogin={goLogin} />;
  else if (route?.name === 'new' && user) body = <NewListingScreen lang={lang} onDone={() => { setRoute({ name: 'mine', posted: true }); setTab('account'); }} />;
  else if (route?.name === 'mine' && user) body = <MyListingsScreen lang={lang} onOpen={openDetail} posted={route.posted} />;
  else if (tab === 'guide') body = <GuidanceScreen lang={lang} onBrowse={() => setTab('home')} onOpen={openDetail} />;
  else if (tab === 'store') body = <StoreScreen lang={lang} onOpen={openDetail}
    onSell={() => { if (user) { setTab('account'); setRoute({ name: 'new' }); } else setTab('account'); }}
    onFavorites={() => setRoute({ name: 'favorites' })}
    accountActionLabel={user ? (lang === 'en' ? 'Log out' : lang === 'ku' ? 'چوونەدەرەوە' : 'خروج') : (lang === 'en' ? 'Sign up' : lang === 'ku' ? 'خۆتۆمارکردن' : 'إنشاء حساب')}
    onAccountAction={() => { if (user) supabase.auth.signOut(); else { setRoute(null); setTab('account'); } }} />;
  else if (tab === 'home') body = <BrowseScreen lang={lang} onOpen={openDetail}
    onSell={() => { if (user) { setTab('account'); setRoute({ name: 'new' }); } else { setRoute(null); setTab('account'); } }}
    onFavorites={() => setRoute({ name: 'favorites' })} />;
  else body = <AccountScreen lang={lang} onNavigate={setRoute} onTab={setTab} />;

  return (
    <FirstRunFlow onComplete={setLang}>
      <SafeAreaView style={[styles.container, { direction: lang === 'en' ? 'ltr' : 'rtl' }]}>
        {route ? (
          <View style={styles.header}>
            <Pressable onPress={() => setRoute(null)}><Text style={styles.back}>{tr(lang, 'back')} ›</Text></Pressable>
            <Text style={styles.brand}>SUPER PHONE</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>{body}</View>
        {!route && (
          <View style={styles.tabs}>
            {TAB_KEYS.map((key, index) => ({ key, label: (TAB_LABELS[lang] || TAB_LABELS.ar)[index] })).map((item) => (
              <Pressable key={item.key} style={styles.tab} onPress={() => { setRoute(null); setTab(item.key); }}>
                <TabIcon name={item.key} active={tab === item.key} />
                <Text style={[styles.tabText, tab === item.key && styles.tabOn]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <StatusBar style="dark" />
      </SafeAreaView>
    </FirstRunFlow>
  );
}

export default function App() {
  return <AuthProvider><Shell /></AuthProvider>;
}

const iconStyles = StyleSheet.create({
  frame: { width: 30, height: 29, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  personHead: { width: 10, height: 10, borderRadius: 6, borderWidth: 1.5, position: 'absolute', top: 1 },
  personBody: { width: 21, height: 12, borderWidth: 1.5, borderBottomWidth: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12, position: 'absolute', bottom: 1 },
  bagHandle: { width: 10, height: 7, borderWidth: 1.5, borderBottomWidth: 0, borderTopLeftRadius: 6, borderTopRightRadius: 6, position: 'absolute', top: 1 },
  bagBody: { width: 22, height: 17, borderWidth: 1.5, borderRadius: 4, position: 'absolute', bottom: 0 },
  guideRing: { width: 24, height: 12, borderWidth: 1.5, borderRadius: 12, position: 'absolute' }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eeeeee' },
  brand: { fontSize: 17, fontWeight: '900', letterSpacing: 1.4, color: '#C8102E' },
  back: { color: '#C8102E', fontSize: 16 },
  tabs: { flexDirection: 'row-reverse', borderTopWidth: 1, borderTopColor: '#e9e9e9', backgroundColor: '#ffffff', paddingTop: 5, paddingBottom: Platform.OS === 'ios' ? 8 : 3 },
  tab: { flex: 1, paddingVertical: 5, alignItems: 'center', gap: 2 },
  tabIcon: { color: '#555555', fontSize: 23, lineHeight: 25 },
  tabText: { color: '#555555', fontSize: 12 },
  tabOn: { color: '#C8102E', fontWeight: '900' }
});
