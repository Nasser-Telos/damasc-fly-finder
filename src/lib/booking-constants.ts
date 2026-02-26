// Shared booking data: countries, titles, Arabic month names

export interface Country {
  code: string;
  name_ar: string;
  flag: string;
  region: string;
}

export const REGIONS = {
  middle_east: 'الشرق الأوسط',
  europe: 'أوروبا',
  americas: 'أمريكا',
  asia: 'آسيا',
  africa: 'أفريقيا',
} as const;

export const COUNTRIES: Country[] = [
  // الشرق الأوسط
  { code: 'SY', name_ar: 'سوريا', flag: '🇸🇾', region: 'middle_east' },
  { code: 'AE', name_ar: 'الإمارات', flag: '🇦🇪', region: 'middle_east' },
  { code: 'SA', name_ar: 'السعودية', flag: '🇸🇦', region: 'middle_east' },
  { code: 'IQ', name_ar: 'العراق', flag: '🇮🇶', region: 'middle_east' },
  { code: 'JO', name_ar: 'الأردن', flag: '🇯🇴', region: 'middle_east' },
  { code: 'LB', name_ar: 'لبنان', flag: '🇱🇧', region: 'middle_east' },
  { code: 'EG', name_ar: 'مصر', flag: '🇪🇬', region: 'middle_east' },
  { code: 'TR', name_ar: 'تركيا', flag: '🇹🇷', region: 'middle_east' },
  { code: 'KW', name_ar: 'الكويت', flag: '🇰🇼', region: 'middle_east' },
  { code: 'QA', name_ar: 'قطر', flag: '🇶🇦', region: 'middle_east' },
  { code: 'BH', name_ar: 'البحرين', flag: '🇧🇭', region: 'middle_east' },
  { code: 'OM', name_ar: 'عُمان', flag: '🇴🇲', region: 'middle_east' },
  { code: 'YE', name_ar: 'اليمن', flag: '🇾🇪', region: 'middle_east' },
  { code: 'PS', name_ar: 'فلسطين', flag: '🇵🇸', region: 'middle_east' },
  { code: 'LY', name_ar: 'ليبيا', flag: '🇱🇾', region: 'middle_east' },
  { code: 'SD', name_ar: 'السودان', flag: '🇸🇩', region: 'middle_east' },
  { code: 'TN', name_ar: 'تونس', flag: '🇹🇳', region: 'middle_east' },
  { code: 'DZ', name_ar: 'الجزائر', flag: '🇩🇿', region: 'middle_east' },
  { code: 'MA', name_ar: 'المغرب', flag: '🇲🇦', region: 'middle_east' },
  // أوروبا
  { code: 'DE', name_ar: 'ألمانيا', flag: '🇩🇪', region: 'europe' },
  { code: 'GB', name_ar: 'بريطانيا', flag: '🇬🇧', region: 'europe' },
  { code: 'FR', name_ar: 'فرنسا', flag: '🇫🇷', region: 'europe' },
  { code: 'SE', name_ar: 'السويد', flag: '🇸🇪', region: 'europe' },
  { code: 'NL', name_ar: 'هولندا', flag: '🇳🇱', region: 'europe' },
  { code: 'IT', name_ar: 'إيطاليا', flag: '🇮🇹', region: 'europe' },
  { code: 'ES', name_ar: 'إسبانيا', flag: '🇪🇸', region: 'europe' },
  { code: 'AT', name_ar: 'النمسا', flag: '🇦🇹', region: 'europe' },
  { code: 'BE', name_ar: 'بلجيكا', flag: '🇧🇪', region: 'europe' },
  { code: 'CH', name_ar: 'سويسرا', flag: '🇨🇭', region: 'europe' },
  { code: 'DK', name_ar: 'الدنمارك', flag: '🇩🇰', region: 'europe' },
  { code: 'NO', name_ar: 'النرويج', flag: '🇳🇴', region: 'europe' },
  { code: 'GR', name_ar: 'اليونان', flag: '🇬🇷', region: 'europe' },
  { code: 'PL', name_ar: 'بولندا', flag: '🇵🇱', region: 'europe' },
  { code: 'RO', name_ar: 'رومانيا', flag: '🇷🇴', region: 'europe' },
  { code: 'CZ', name_ar: 'التشيك', flag: '🇨🇿', region: 'europe' },
  // أمريكا
  { code: 'US', name_ar: 'الولايات المتحدة', flag: '🇺🇸', region: 'americas' },
  { code: 'CA', name_ar: 'كندا', flag: '🇨🇦', region: 'americas' },
  { code: 'BR', name_ar: 'البرازيل', flag: '🇧🇷', region: 'americas' },
  { code: 'MX', name_ar: 'المكسيك', flag: '🇲🇽', region: 'americas' },
  { code: 'AR', name_ar: 'الأرجنتين', flag: '🇦🇷', region: 'americas' },
  // آسيا
  { code: 'IN', name_ar: 'الهند', flag: '🇮🇳', region: 'asia' },
  { code: 'CN', name_ar: 'الصين', flag: '🇨🇳', region: 'asia' },
  { code: 'JP', name_ar: 'اليابان', flag: '🇯🇵', region: 'asia' },
  { code: 'KR', name_ar: 'كوريا الجنوبية', flag: '🇰🇷', region: 'asia' },
  { code: 'MY', name_ar: 'ماليزيا', flag: '🇲🇾', region: 'asia' },
  { code: 'PK', name_ar: 'باكستان', flag: '🇵🇰', region: 'asia' },
  { code: 'RU', name_ar: 'روسيا', flag: '🇷🇺', region: 'asia' },
];

export const TITLE_OPTIONS = [
  { value: 'mr', label: 'السيد (Mr)' },
  { value: 'ms', label: 'الآنسة (Ms)' },
  { value: 'mrs', label: 'السيدة (Mrs)' },
] as const;

export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل',
  'مايو', 'يونيو', 'يوليو', 'أغسطس',
  'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const;

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountriesByRegion(regionKey: string): Country[] {
  return COUNTRIES.filter(c => c.region === regionKey);
}
