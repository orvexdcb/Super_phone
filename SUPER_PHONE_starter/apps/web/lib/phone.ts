// يحوّل رقماً عراقياً محلياً (07XXXXXXXXX) إلى صيغة دولية لواتساب
export function toWhatsApp(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 8) return null;
  if (d.startsWith("964")) return d;
  if (d.startsWith("0")) return "964" + d.slice(1);
  return d;
}
