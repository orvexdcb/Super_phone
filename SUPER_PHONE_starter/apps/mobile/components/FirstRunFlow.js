import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { GOVERNORATES, IRAQ_DISTRICTS } from '../lib/constants';
import { governorateLabel, districtLabel } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import * as Location from 'expo-location';

const KEY = 'superphone:first-run:v3';
const TIPS_KEY = 'superphone:reference-tour:v3';
const T = {
  ar: {
    language: 'اختر اللغة', place: 'أين تسكن؟', governorate: 'المحافظة', area: 'المدينة / المنطقة',
    gps: 'تحديد موقعي', next: 'التالي', start: 'ابدأ الاستخدام', terms: 'Terms & Conditions',
    tipTitle: ['بيع جهازك', 'بحث سهل ودقيق', 'احفظ الأجهزة في المفضلة', 'حسابك'],
    tipBody: ['قم بعرض جهازك بسهولة في SUPER PHONE مع الصور والسعر والمواصفات.', 'ابحث حسب نوع الجهاز والعلامة التجارية والحالة والسعر.', 'اضغط على رمز القلب لحفظ الأجهزة والعودة إليها لاحقاً.', 'من هنا تنشئ حساباً أو تسجل الخروج عند الدخول.'],
    skip: 'تخطي', finish: 'ابدأ الاستخدام', hint: 'اختر المحافظة والمدينة أو حدد موقعك للمساعدة في الاختيار.',
    located: 'تم تحديد المحافظة:'
  },
  en: {
    language: 'Choose your language', place: 'Where do you live?', governorate: 'Governorate', area: 'City / area',
    gps: 'Use my location', next: 'Next', start: 'Start using the app', terms: 'Terms & Conditions',
    tipTitle: ['Sell your device', 'Easy and accurate search', 'Save devices to Favorites', 'Your account'],
    tipBody: ['List your device on SUPER PHONE with photos, price and specifications.', 'Search by device type, brand, condition and price.', 'Tap the heart to save devices and return to them later.', 'Open your account here to sign up or log out.'],
    skip: 'Skip', finish: 'Start using the app', hint: 'Choose your governorate and city, or use your location to help select them.',
    located: 'Detected governorate:'
  },
  ku: {
    language: 'زمان هەڵبژێرە', place: 'لە کوێ دەژیت؟', governorate: 'پارێزگا', area: 'شار / ناوچە',
    gps: 'شوێنەکەم دیاری بکە', next: 'دواتر', start: 'دەستپێبکە', terms: 'Terms & Conditions',
    tipTitle: ['ئامێرەکەت بفرۆشە', 'گەڕانی ئاسان و ورد', 'ئامێرەکان لە دڵخوازەکان بپارێزە', 'هەژمارەکەت'],
    tipBody: ['ئامێرەکەت بە وێنە و نرخ و تایبەتمەندییەکان لە SUPER PHONE بڵاو بکەرەوە.', 'بەپێی جۆر و براند و دۆخ و نرخ بگەڕێ.', 'نیشانی دڵ دابگرە بۆ پاراستنی ئامێرەکانت.', 'لێرە هەژمار دروست بکە یان بچۆرە دەرەوە.'],
    skip: 'تێپەڕاندن', finish: 'دەستپێبکە', hint: 'پارێزگا و شار هەڵبژێرە یان شوێنی خۆت دیاری بکە.',
    located: 'پارێزگای دیاریکراو:'
  }
};

export default function FirstRunFlow({ children, onComplete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('ar');
  const [accepted, setAccepted] = useState(true);
  const [permissionPrompted, setPermissionPrompted] = useState(false);
  const [gov, setGov] = useState('بغداد');
  const [area, setArea] = useState('بغداد');
  const [showGovernorates, setShowGovernorates] = useState(false);
  const [gps, setGps] = useState('');
  const [tutorialStep, setTutorialStep] = useState(-1);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        const savedLang = ['ar', 'en', 'ku'].includes(saved.lang) ? saved.lang : 'ar';
        setLang(savedLang);
        onComplete?.(savedLang);
        setGov(saved.governorate || 'بغداد');
        setArea(saved.area || 'بغداد');
        setDone(true);
      } catch {}
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || done || step !== 0) return;
    const splashTimer = setTimeout(() => setStep(1), 900);
    return () => clearTimeout(splashTimer);
  }, [loading, done, step]);

  useEffect(() => {
    if (loading || done || step !== 1 || permissionPrompted) return;
    setPermissionPrompted(true);
    Location.requestForegroundPermissionsAsync().catch(() => {});
  }, [loading, done, step, permissionPrompted]);

  useEffect(() => {
    if (!done) return;
    AsyncStorage.getItem(TIPS_KEY).then((raw) => {
      if (!raw) setTutorialStep(0);
    }).catch(() => setTutorialStep(0));
  }, [done]);

  useEffect(() => {
    if (!done || !user?.id) return;
    AsyncStorage.getItem(KEY).then(async (raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (!saved.governorate) return;
        const { data: profile } = await supabase.from('profiles').select('governorate').eq('id', user.id).maybeSingle();
        if (profile && !profile.governorate) {
          await supabase.from('profiles').update({ governorate: saved.governorate, city: saved.area || null }).eq('id', user.id);
        }
      } catch {}
    });
  }, [done, user?.id]);

  const finish = async () => {
    const saved = { lang, governorate: gov, area, completed: true };
    await AsyncStorage.setItem(KEY, JSON.stringify(saved));
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user && gov) {
        await supabase.from('profiles').update({ governorate: gov, city: area || null }).eq('id', authData.user.id);
      }
    } catch {}
    setDone(true);
    setTutorialStep(0);
    onComplete?.(lang);
  };

  const finishTutorial = async () => {
    await AsyncStorage.setItem(TIPS_KEY, 'completed');
    setTutorialStep(-1);
  };

  const nextTutorial = () => {
    if (tutorialStep < 3) setTutorialStep(tutorialStep + 1);
    else finishTutorial();
  };

  const requestLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { setGps(t.hint); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const places = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      const place = places?.[0] || {};
      const candidates = [place.region, place.subregion, place.city, place.district, place.name].filter(Boolean).map((v) => String(v).toLocaleLowerCase().trim());
      const normalize = (value) => String(value || '').toLocaleLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();
      const matchedGov = GOVERNORATES.find((g) => {
        const aliases = [g, governorateLabel('en', g), governorateLabel('ku', g)].map(normalize);
        return candidates.some((candidate) => aliases.some((alias) => alias && normalize(candidate).includes(alias)));
      });
      if (!matchedGov) { setGps(t.hint); return; }
      const districts = IRAQ_DISTRICTS[matchedGov] || [];
      const matchedArea = districts.find((d) => {
        const aliases = [d, districtLabel('en', d), districtLabel('ku', d)].map(normalize);
        return candidates.some((candidate) => aliases.some((alias) => alias && normalize(candidate).includes(alias)));
      });
      setGov(matchedGov);
      setArea(matchedArea || '');
      setGps(t.located + ' ' + governorateLabel(lang, matchedGov) + (matchedArea ? ' · ' + districtLabel(lang, matchedArea) : ''));
    } catch { setGps(t.hint); }
  };

  if (loading) return <View style={s.splash}><StatusBar style="light" /><ActivityIndicator color="#C8102E" /></View>;
  if (done) {
    return (
      <View style={s.appRoot}>
        {children}
        {tutorialStep >= 0 ? (
          <View style={s.tourRoot}>
            <View style={s.tourShade} />
            <View style={[s.tourFocus, tutorialStep === 0 ? s.tourSellFocus : tutorialStep === 1 ? s.tourSearchFocus : tutorialStep === 2 ? s.tourFavoritesFocus : s.tourAccountFocus]} />
            <View style={s.tourBubble}>
              <View style={[s.tourPointer, tutorialStep === 0 ? s.pointerSell : tutorialStep === 1 ? s.pointerSearch : tutorialStep === 2 ? s.pointerFavorites : s.pointerAccount]} />
              <Text style={s.tourTitle}>{T[lang].tipTitle[tutorialStep]}</Text>
              <Text style={s.tourText}>{T[lang].tipBody[tutorialStep]}</Text>
              <View style={s.tourActions}>
                <Pressable onPress={finishTutorial} style={s.tourSkip}><Text style={s.tourSkipText}>{T[lang].skip}</Text></Pressable>
                <Pressable onPress={nextTutorial} style={s.tourNext}><Text style={s.tourNextText}>{tutorialStep < 3 ? T[lang].next : T[lang].finish}</Text></Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  const t = T[lang];
  const districts = IRAQ_DISTRICTS[gov] || [];

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      {step === 0 ? (
        <View style={s.splash}>
          <Image source={require('../assets/icon.png')} style={s.logo} resizeMode="contain" />
          <Text style={s.brand}>SUPER PHONE</Text>
          <Text style={s.welcome}>سوق الهواتف والأجهزة الذكية</Text>
        </View>
      ) : step === 1 ? (
        <View style={s.languagePage}>
          <View style={s.languageSpacer} />
          {[
            ['en', 'English'],
            ['ar', 'عربي'],
            ['ku', 'کوردی']
          ].map(([value, label]) => (
            <Pressable key={value} onPress={() => { if (accepted) { setLang(value); setStep(2); } else setLang(value); }}
              style={[s.languageOption, lang === value && s.languageSelected]}>
              <Text style={s.languageText}>{label}</Text>
            </Pressable>
          ))}
          <View style={s.languageSpacer} />
          <Pressable style={s.termsRow} onPress={() => setAccepted((v) => { const next = !v; if (next) setStep(2); return next; })}>
            <Text style={s.termsText}>{t.terms}</Text>
            <View style={[s.checkbox, accepted && s.checkboxOn]}>{accepted ? <Text style={s.checkmark}>✓</Text> : null}</View>
          </Pressable>
        </View>
      ) : (
        <View style={s.locationPage}>
          <Text style={s.locationTitle}>{t.place}</Text>
          <ScrollView style={s.locationScroll} contentContainerStyle={s.locationContent} showsVerticalScrollIndicator={false}>
            <Text style={s.locationLabel}>{t.governorate}</Text>
            <Pressable style={s.dropdown} onPress={() => setShowGovernorates(true)}>
              <Text style={s.dropdownValue}>{governorateLabel(lang, gov)}</Text>
              <Text style={s.dropdownArrow}>⌄</Text>
            </Pressable>
            <Text style={s.locationLabel}>{t.area}</Text>
            <View style={s.districtList}>
              {districts.map((district) => (
                <Pressable key={district} onPress={() => setArea(district)} style={[s.districtButton, area === district && s.districtSelected]}>
                  <Text style={s.districtText}>{districtLabel(lang, district)}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={s.gpsButton} onPress={requestLocation}><Text style={s.gpsText}>⌖  {t.gps}</Text></Pressable>
            <Text style={s.gpsHint}>{gps || t.hint}</Text>
            <Pressable style={[s.continueButton, (!gov || !area) && s.continueDisabled]} disabled={!gov || !area} onPress={finish}>
              <Text style={s.continueText}>{t.next}</Text>
            </Pressable>
          </ScrollView>
          <Modal visible={showGovernorates} transparent animationType="fade" onRequestClose={() => setShowGovernorates(false)}>
            <View style={s.modalShade}>
              <View style={s.modalCard}>
                <Text style={s.modalTitle}>{t.governorate}</Text>
                <ScrollView style={s.modalList}>
                  {GOVERNORATES.map((item) => (
                    <Pressable key={item} style={s.modalOption} onPress={() => { setGov(item); setArea(''); setShowGovernorates(false); }}>
                      <Text style={s.modalOptionText}>{governorateLabel(lang, item)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable onPress={() => setShowGovernorates(false)} style={s.modalClose}><Text style={s.modalCloseText}>{t.next}</Text></Pressable>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: '#FFFFFF' },
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  splash: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 174, height: 174, marginBottom: 10 },
  brand: { color: '#C8102E', fontSize: 27, fontWeight: '900', letterSpacing: 2 },
  welcome: { color: '#aeb8c7', fontSize: 13, marginTop: 7 },
  splashDots: { flexDirection: 'row', gap: 6, marginTop: 38 },
  dotActive: { width: 24, height: 3, borderRadius: 2, backgroundColor: '#C8102E' },
  dot: { width: 6, height: 3, borderRadius: 2, backgroundColor: '#d5d5d5' },
  startButton: { marginTop: 30, paddingHorizontal: 25, paddingVertical: 13, backgroundColor: '#C8102E', borderRadius: 9 },
  startText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  languagePage: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 38, paddingTop: 90, paddingBottom: 90 },
  languageSpacer: { flex: 1 },
  languageOption: { height: 72, borderWidth: 1.4, borderColor: 'rgba(200,16,46,0.25)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: '#FFFFFF' },
  languageSelected: { borderColor: 'rgba(200,16,46,0.25)' },
  languageText: { color: '#333333', fontSize: 21, fontWeight: '600' },
  termsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24, minHeight: 42 },
  termsText: { color: '#C8102E', fontSize: 15 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#C8102E', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: '#C8102E' },
  checkmark: { color: '#ffffff', fontSize: 14, fontWeight: '900', lineHeight: 17 },
  locationPage: { flex: 1, backgroundColor: '#FFFFFF' },
  locationTitle: { color: '#333333', fontSize: 23, fontWeight: '900', textAlign: 'center', paddingTop: 26, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(200,16,46,0.18)' },
  locationScroll: { flex: 1 },
  locationContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, gap: 10 },
  locationLabel: { color: '#d2d7df', fontSize: 19, fontWeight: '700', textAlign: 'right', marginTop: 3 },
  dropdown: { minHeight: 58, borderWidth: 1.3, borderColor: 'rgba(200,16,46,0.25)', borderRadius: 13, paddingHorizontal: 17, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  dropdownValue: { color: '#454545', fontSize: 20, fontWeight: '600' },
  dropdownArrow: { color: '#d2d7df', fontSize: 25 },
  districtList: { gap: 9 },
  districtButton: { minHeight: 58, borderWidth: 1.3, borderColor: 'rgba(200,16,46,0.25)', borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  districtSelected: { borderColor: '#C8102E', backgroundColor: '#C8102E' },
  districtText: { color: '#333333', fontSize: 19, fontWeight: '600' },
  gpsButton: { marginTop: 8, minHeight: 48, borderWidth: 1.2, borderColor: '#C8102E', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gpsText: { color: '#C8102E', fontSize: 14, fontWeight: '800' },
  gpsHint: { color: '#aeb8c7', fontSize: 12, textAlign: 'right' },
  continueButton: { backgroundColor: '#C8102E', borderRadius: 10, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  continueDisabled: { opacity: 0.45 },
  continueText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 22 },
  modalCard: { maxHeight: '82%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  modalTitle: { color: '#333333', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  modalList: { maxHeight: 500 },
  modalOption: { minHeight: 50, borderBottomWidth: 1, borderBottomColor: 'rgba(200,16,46,0.16)', justifyContent: 'center', alignItems: 'center' },
  modalOptionText: { color: '#333333', fontSize: 17, fontWeight: '600' },
  modalClose: { backgroundColor: '#C8102E', borderRadius: 9, alignItems: 'center', paddingVertical: 11, marginTop: 12 },
  modalCloseText: { color: '#ffffff', fontWeight: '900' },
  tourRoot: { ...StyleSheet.absoluteFillObject, zIndex: 1000, justifyContent: 'flex-start' },
  tourShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.58)' },
  tourFocus: { position: 'absolute', top: 40, height: 36, width: 72, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#ffffff', borderRadius: 7 },
  tourSellFocus: { left: '23%' },
  tourSearchFocus: { left: '3%' },
  tourFavoritesFocus: { left: '67%' },
  tourAccountFocus: { left: '82%' },
  tourBubble: { position: 'absolute', top: 111, left: 14, width: '80%', minHeight: 66, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11, backgroundColor: '#C8102E' },
  tourPointer: { position: 'absolute', top: -10, width: 0, height: 0, borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 11, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#C8102E' },
  pointerSell: { left: '36%' },
  pointerSearch: { left: '10%' },
  pointerFavorites: { left: '76%' },
  pointerAccount: { left: '91%' },
  tourTitle: { color: '#ffffff', textAlign: 'center', fontSize: 17, fontWeight: '900' },
  tourText: { color: '#ffffff', textAlign: 'center', fontSize: 13, lineHeight: 18, marginTop: 3 },
  tourActions: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 },
  tourSkip: { padding: 7 },
  tourSkipText: { color: '#ffffff', fontWeight: '700' },
  tourNext: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 7 },
  tourNextText: { color: '#C8102E', fontWeight: '900' }
});
