"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";

async function requireFounder(){
 const s=await createServerSupabase();
 const {data:{user}}=await s.auth.getUser();
 if(!user) redirect("/login");
 const {data:p}=await s.from("profiles").select("role").eq("id",user.id).single();
 if(p?.role!=="admin") redirect("/account");
 return s;
}
function refresh(){revalidatePath("/founder/settings");revalidatePath("/founder/plans");revalidatePath("/account");}

export async function createPlan(f:FormData){
 const s=await requireFounder();
 const name=String(f.get("name")||"").trim();
 const price=Number(f.get("price"));
 const duration=Number(f.get("duration_days"));
 const maxListings=Number(f.get("max_active_listings"));
 const maxFeatured=Number(f.get("max_featured_listings")||0);
 if(name.length<2||!Number.isFinite(price)||price<0||!Number.isInteger(duration)||duration<1||!Number.isInteger(maxListings)||maxListings<0||!Number.isInteger(maxFeatured)||maxFeatured<0) throw new Error("تحقق من بيانات الباقة");
 const {error}=await s.from("subscription_plans").insert({name,description:String(f.get("description")||"").trim()||null,price,currency:String(f.get("currency")||"IQD"),duration_days:duration,max_active_listings:maxListings,max_featured_listings:maxFeatured,sort_order:Number(f.get("sort_order")||0),is_active:true});
 if(error) throw new Error(error.message); refresh();
}
export async function togglePlan(f:FormData){
 const s=await requireFounder(); const id=String(f.get("id")); const active=String(f.get("active"))==="true";
 const {error}=await s.from("subscription_plans").update({is_active:!active}).eq("id",id);
 if(error) throw new Error(error.message); refresh();
}
export async function createDiscount(f:FormData){
 const s=await requireFounder();
 const code=String(f.get("code")||"").trim().toUpperCase().replace(/\\s+/g,"");
 const type=String(f.get("discount_type")||"percentage");
 const value=Number(f.get("discount_value"));
 const applies=String(f.get("applies_to")||"both");
 const planId=String(f.get("plan_id")||"")||null;
 const startRaw=String(f.get("starts_at")||"");
 const endRaw=String(f.get("expires_at")||"");
 const maxRaw=String(f.get("max_redemptions")||"");
 const max=maxRaw?Number(maxRaw):null;
 if(!/^[A-Z0-9_-]{3,40}$/.test(code)||!["percentage","fixed"].includes(type)||!Number.isFinite(value)||value<=0||(type==="percentage"&&value>100)||!["both","plans","listing_fees"].includes(applies)||(applies==="plans"&&!planId)||(max!==null&&(!Number.isInteger(max)||max<1))) throw new Error("تحقق من بيانات كود الخصم");
 const starts=startRaw?new Date(startRaw).toISOString():new Date().toISOString();
 const expires=endRaw?new Date(endRaw).toISOString():null;
 if(expires&&new Date(expires)<=new Date(starts)) throw new Error("تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية");
 const {error}=await s.from("discount_codes").insert({code,discount_type:type,discount_value:value,currency:String(f.get("currency")||"IQD"),applies_to:applies,plan_id:planId,starts_at:starts,expires_at:expires,max_redemptions:max,is_active:true});
 if(error) throw new Error(error.message); refresh();
}
export async function toggleDiscount(f:FormData){
 const s=await requireFounder(); const id=String(f.get("id")); const active=String(f.get("active"))==="true";
 const {error}=await s.from("discount_codes").update({is_active:!active}).eq("id",id);
 if(error) throw new Error(error.message); refresh();
}
