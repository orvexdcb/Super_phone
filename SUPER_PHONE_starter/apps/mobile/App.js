import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackHandler, Platform, Pressable, SafeAreaView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { COLORS } from './lib/constants';
import BrowseScreen from './screens/BrowseScreen';
import DetailScreen from './screens/DetailScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import AccountScreen from './screens/AccountScreen';
import NewListingScreen from './screens/NewListingScreen';
import MyListingsScreen from './screens/MyListingsScreen';
import FirstRunFlow from './components/FirstRunFlow';

const TAB_LABELS = { ar: ['الرئيسية','المفضلة','إعلان','إعلاناتي','حسابي'], en: ['Home','Favorites','Post','My listings','Account'], ku: ['سەرەکی','دڵخوازەکان','بڵاوکردنەوە','بڵاوکراوەکانم','هەژمار'] };
const TAB_KEYS = ['home','favorites','new','mine','account'];
const TAB_ICONS = ['⌂','♡','+','▤','○'];

function Shell() {
  const { user } = useAuth();
  const [tab, setTab] = useState('home');
  const [route, setRoute] = useState(null);
  const [lang, setLang] = useState('ar');
  useEffect(() => { AsyncStorage.getItem('superphone:first-run:v1').then(raw => { if (raw) { try { setLang(JSON.parse(raw).lang || 'ar'); } catch {} } }); }, []);

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
  if (route?.name === 'detail') body = <DetailScreen id={route.id} onNeedLogin={goLogin} />;
  else if (route?.name === 'new' && user) body = <NewListingScreen onDone={() => { setRoute({ name: 'mine', posted: true }); setTab('mine'); }} />;
  else if (route?.name === 'mine' && user) body = <MyListingsScreen onOpen={openDetail} posted={route.posted} />;
  else if (tab === 'home') body = <BrowseScreen lang={lang} onOpen={openDetail}
    onSell={() => { if (user) { setTab('new'); setRoute({ name: 'new' }); } else { setRoute(null); setTab('account'); } }}
    onFavorites={() => setTab('favorites')} />;
  else if (tab === 'favorites') {
    body = user ? <FavoritesScreen onOpen={openDetail} /> : (
      <View style={styles.center}>
        <Text style={styles.muted}>سجّل الدخول لعرض مفضلتك.</Text>
        <Pressable onPress={() => setTab('account')}><Text style={styles.link}>تسجيل الدخول</Text></Pressable>
      </View>
    );
  } else {
    body = <AccountScreen onNavigate={setRoute} />;
  }

  return (
    <FirstRunFlow>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {route ? (
          <Pressable onPress={() => setRoute(null)}><Text style={styles.back}>رجوع ›</Text></Pressable>
        ) : <View />}
        <Text style={styles.brand}>SUPER PHONE</Text>
      </View>
      <View style={{ flex: 1 }}>{body}</View>
      {!route && (
        <View style={styles.tabs}>
          {TAB_KEYS.map((key, index) => ({ key, icon: TAB_ICONS[index], label: (TAB_LABELS[lang] || TAB_LABELS.ar)[index] })).map((t) => (
            <Pressable key={t.key} style={styles.tab} onPress={() => {
              if (t.key === 'new' || t.key === 'mine') {
                if (!user) { setRoute(null); setTab('account'); return; }
                setTab(t.key);
                setRoute(t.key === 'new' ? { name: 'new' } : { name: 'mine' });
                return;
              }
              setRoute(null);
              setTab(t.key);
            }}>
              <Text style={[styles.tabIcon, (tab === t.key || route?.name === t.key) && styles.tabOn]}>{t.icon}</Text>
              <Text style={[styles.tabText, tab === t.key && styles.tabOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <StatusBar style="light" />
    </SafeAreaView>
    </FirstRunFlow>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, backgroundColor: COLORS.bg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  brand: { fontSize: 19, fontWeight: '800', letterSpacing: 2, color: COLORS.goldLight },
  back: { color: COLORS.gold, fontSize: 16 },
  tabs: { flexDirection: 'row-reverse', borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.panel, paddingBottom: Platform.OS === 'ios' ? 8 : 2 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', gap: 3 },
  tabIcon: { color: COLORS.muted, fontSize: 20, lineHeight: 23 },
  tabText: { color: COLORS.muted, fontSize: 10 },
  tabOn: { color: COLORS.gold, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { color: COLORS.muted },
  link: { color: COLORS.gold, fontWeight: '700' },
});
