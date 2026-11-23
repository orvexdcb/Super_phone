import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";

export async function POST(req:NextRequest){
 try{
  const s=await createServerSupabase();
  const {data:{user}}=await s.auth.getUser();
  if(!user)return NextResponse.json({error:"يجب تسجيل الدخول أولاً"},{status:401});
  const body=await req.json();
  const code=String(body.code||"").trim().toUpperCase();
  const applies=String(body.applies_to||"");
  const amount=Number(body.amount);
  const currency=String(body.currency||"IQD");
  const planId=body.plan_id?String(body.plan_id):null;
  if(!/^[A-Z0-9_-]{3,40}$/.test(code)||!["plan","listing_fee"].includes(applies)||!Number.isFinite(amount)||amount<0||!["IQD","USD"].includes(currency))
   return NextResponse.json({error:"بيانات كود الخصم غير صحيحة"},{status:400});
  const {data,error}=await s.rpc("quote_discount_code",{p_code:code,p_applies_to:applies,p_amount:amount,p_currency:currency,p_plan_id:planId});
  if(error)return NextResponse.json({error:error.message},{status:422});
  return NextResponse.json(data);
 }catch{return NextResponse.json({error:"تعذر التحقق من كود الخصم"},{status:400});}
}
