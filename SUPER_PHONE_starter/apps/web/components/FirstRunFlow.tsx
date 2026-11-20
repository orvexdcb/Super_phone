"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBrowserSupabase } from "../lib/supabase-browser";
import { GOVERNORATES, IRAQ_DISTRICTS } from "@super-phone/shared";
const KEY="superphone:first-run:v1";
const copy={
ar:{language:"اختر اللغة",place:"حدد مكان السكن",province:"المحافظة",area:"المنطقة / القضاء",gps:"طلب تحديد الموقع",next:"التالي",skip:"تخطي",start:"ابدأ الاستخدام",intro:["زر بيع هاتفك يتيح لك عرض جهازك للبيع مع الصور والسعر.","زر البحث يساعدك في العثور على الجهاز الذي تريده.","المفضلة تحفظ الأجهزة التي تريد العودة إليها.","الأزرار الرئيسية في أعلى الشاشة ويمكنك استخدامها للتنقل."],gpsHint:"يمكنك السماح بالوصول للموقع أو إكمال الاختيار يدوياً."},
en:{language:"Choose your language",place:"Set your location",province:"Governorate",area:"Area / District",gps:"Request location",next:"Next",skip:"Skip",start:"Start using SUPER PHONE",intro:["Sell your phone lets you publish your device with photos and a price.","Search helps you find the device you need.","Favorites saves devices for later.","The main actions are at the top of the home screen."],gpsHint:"You can allow location access or continue manually."},
ku:{language:"زمان هەڵبژێرە",place:"شوێنی نیشتەجێبوون دیاری بکە",province:"پارێزگا",area:"ناوچە / قەزا",gps:"داوای شوێن",next:"دواتر",skip:"تێپەڕاندن",start:"دەستپێبکە",intro:["فرۆشتنی مۆبایل بۆ بڵاوکردنەوەی ئامێرەکەتە.","گەڕان بۆ دۆزینەوەی ئامێری دڵخوازە.","دڵخوازەکان ئامێرەکانت دەپارێزێت.","دوگمە سەرەکییەکان لە سەرەوەی شاشەکەن."],gpsHint:"دەتوانیت مۆڵەتی شوێن بدەیت یان بە دەستی هەڵیبژێریت."}
};
export default function FirstRunFlow({children}:{children:React.ReactNode}){
 const router=useRouter();
 const [done,setDone]=useState(true),[loaded,setLoaded]=useState(false),[step,setStep]=useState(0),[lang,setLang]=useState("ar"),[gov,setGov]=useState(""),[area,setArea]=useState(""),[gps,setGps]=useState("");
 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(!raw)setDone(false);else{const saved=JSON.parse(raw);const savedLang=["ar","en","ku"].includes(saved.lang)?saved.lang:"ar";setLang(savedLang);document.cookie=`sp_lang=${savedLang}; path=/; max-age=31536000; samesite=lax`;router.refresh();}}catch{setDone(false)}setLoaded(true)},[]);
 if(!loaded)return <div className="first-run-overlay"><div className="first-run-panel"><Image src="/pwa-icon-512.png" alt="SUPER PHONE" width={124} height={124}/><div className="first-run-title">SUPER PHONE</div></div></div>;
 if(done)return <>{children}</>;
 const t=copy[lang as keyof typeof copy];
 const finish=async()=>{localStorage.setItem(KEY,JSON.stringify({lang,governorate:gov,area,completed:true}));document.cookie=`sp_lang=${lang}; path=/; max-age=31536000; samesite=lax`;document.documentElement.lang=lang;document.documentElement.dir=lang==="en"?"ltr":"rtl";try{const sb=createBrowserSupabase();const {data:{user}}=await sb.auth.getUser();if(user&&gov){const {error}=await sb.from("profiles").update({governorate:gov,city:area.trim()||null}).eq("id",user.id);if(error)console.warn("Profile location save failed",error.message)}}catch(error){console.warn("Profile location save failed",error)}setDone(true);router.refresh()};
 const requestLocation=()=>{setGps(t.gpsHint);if("geolocation" in navigator)navigator.geolocation.getCurrentPosition(()=>setGps(t.gpsHint),()=>setGps(t.gpsHint))};
 return <div className="first-run-overlay"><section className="first-run-panel">
 {step===0?<><Image src="/pwa-icon-512.png" alt="SUPER PHONE" width={124} height={124} className="first-run-logo"/><div className="first-run-title">SUPER PHONE</div><button className="first-run-btn" onClick={()=>setStep(1)}>{t.next}</button></>:
 step===1?<><h2 className="first-run-title">{t.language}</h2>{([["ar","العربية"],["en","English"],["ku","کوردی"]] as const).map(([k,v])=><button type="button" key={k} className={"first-run-option "+(lang===k?"active":"")} onClick={()=>setLang(k)}>{v}</button>)}<button className="first-run-btn" onClick={()=>setStep(2)}>{t.next}</button></>:
 step===2?<><h2 className="first-run-title">{t.place}</h2><label>{t.province}</label><select value={gov} onChange={e=>{setGov(e.target.value);setArea("");}} className="first-run-field"><option value="">—</option>{GOVERNORATES.map(g=><option key={g}>{g}</option>)}</select><label>{t.area}</label><select value={area} onChange={e=>setArea(e.target.value)} className="first-run-field" disabled={!gov}><option value="">—</option>{(IRAQ_DISTRICTS[gov as keyof typeof IRAQ_DISTRICTS] || []).map(d=><option key={d}>{d}</option>)}</select><button className="first-run-btn" onClick={requestLocation}>{t.gps}</button><p>{gps}</p><button className="first-run-btn" disabled={!gov||!area.trim()} onClick={()=>setStep(3)}>{t.next}</button></>:
 <><h2 className="first-run-title">SUPER PHONE</h2><p>{t.intro[step-3]}</p><button className="first-run-btn" onClick={()=>step===6?finish():setStep(step+1)}>{step===6?t.start:t.next}</button><button className="first-run-btn secondary" onClick={finish}>{t.skip}</button></>}
 </section></div>
}
