export const CONDITION_LABELS = { new: 'جديد', used: 'مستعمل', refurbished: 'مجدَّد' };

export const SPEC_LABELS = {
  storage: 'التخزين', ram: 'الذاكرة', battery_health: 'صحة البطارية', color: 'اللون',
};

export const COLORS = {
  green: '#d8ad5e', gold: '#d8ad5e', goldLight: '#f0d39a', bg: '#0b1728', panel: '#17263a', panelAlt: '#223249', text: '#f7f4ed', muted: '#b8c1ce', border: '#35445a', danger: '#d87970', success: '#75bd99',
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
