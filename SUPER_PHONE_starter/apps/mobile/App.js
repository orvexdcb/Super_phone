import React, { useEffect, useState } from 'react';
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

const TABS = [
  { key: 'home', label: 'الرئيسية' },
  { key: 'favorites', label: 'المفضلة' },
  { key: 'account', label: 'حسابي' },
];

function Shell() {
  const { user } = useAuth();
  const [tab, setTab] = useState('home');
  const [route, setRoute] = useState(null); // null | {name:'detail',id} | {name:'new'} | {name:'mine',posted?}
  const detailId = route?.name === 'detail' ? route.id : null;
  const openDetail = (id) => setRoute({ name: 'detail', id });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route) { setRoute(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [route]);

  const goLogin = () => { setRoute(null); setTab('account'); };

  let body;
  if (route?.name === 'detail') body = <DetailScreen id={route.id} onNeedLogin={goLogin} />;
  else if (route?.name === 'new' && user) body = <NewListingScreen onDone={() => setRoute({ name: 'mine', posted: true })} />;
  else if (route?.name === 'mine' && user) body = <MyListingsScreen onOpen={openDetail} posted={route.posted} />;
  else if (tab === 'home') body = <BrowseScreen onOpen={openDetail} />;
  else if (tab === 'favorites')
    body = user ? <FavoritesScreen onOpen={openDetail} /> : (
      <View style={styles.center}>
        <Text style={styles.muted}>سجّل الدخول لعرض مفضلتك.</Text>
        <Pressable onPress={() => setTab('account')}><Text style={styles.link}>تسجيل الدخول</Text></Pressable>
      </View>
    );
  else body = <AccountScreen onNavigate={setRoute} />;

  return (
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
          {TABS.map((t) => (
            <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, tab === t.key && styles.tabOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
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
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  brand: { fontSize: 16, fontWeight: '700', letterSpacing: 2, color: COLORS.green },
  back: { color: COLORS.green, fontSize: 16 },
  tabs: { flexDirection: 'row-reverse', borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#fff' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { color: COLORS.muted },
  tabOn: { color: COLORS.green, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { color: COLORS.muted },
  link: { color: COLORS.green, fontWeight: '700' },
});
