export const CONDITION_LABELS = { new: 'جديد', used: 'مستعمل', refurbished: 'مجدَّد' };

export const SPEC_LABELS = {
  storage: 'التخزين', ram: 'الذاكرة', battery_health: 'صحة البطارية', color: 'اللون',
};

export const COLORS = {
  green: '#16734f', bg: '#f5f7f6', text: '#17231f', muted: '#65736d', border: '#e3e9e6', danger: '#b42318',
};

export function formatPrice(price, currency) {
  const n = new Intl.NumberFormat('en-US').format(Number(price));
  return currency === 'USD' ? `$${n}` : `${n} د.ع`;
}

export function toWhatsApp(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length < 8) return null;
  if (d.startsWith('964')) return d;
  if (d.startsWith('0')) return '964' + d.slice(1);
  return d;
}

export const GOVERNORATES = [
  'بغداد', 'نينوى', 'البصرة', 'أربيل', 'السليمانية', 'دهوك', 'كركوك', 'الأنبار',
  'النجف', 'كربلاء', 'بابل', 'ديالى', 'صلاح الدين', 'ذي قار', 'واسط', 'ميسان',
  'المثنى', 'القادسية', 'حلبجة',
];

export const STATUS_LABELS = {
  draft: 'مسودة', pending_review: 'قيد المراجعة', active: 'منشور',
  paused: 'متوقف', sold: 'تم البيع', rejected: 'مرفوض',
};

export const MAX_IMAGES = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
