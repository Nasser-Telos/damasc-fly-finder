interface GeoEntry {
  airportCode: string;
  cityNameAr: string;
}

export const countryGeoMapping: Record<string, GeoEntry> = {
  // Gulf / Middle East
  AE: { airportCode: 'DXB', cityNameAr: 'دبي' },
  QA: { airportCode: 'DOH', cityNameAr: 'الدوحة' },
  SA: { airportCode: 'JED', cityNameAr: 'جدة' },
  KW: { airportCode: 'KWI', cityNameAr: 'الكويت' },
  BH: { airportCode: 'BAH', cityNameAr: 'البحرين' },
  OM: { airportCode: 'MCT', cityNameAr: 'مسقط' },
  JO: { airportCode: 'AMM', cityNameAr: 'عمّان' },
  LB: { airportCode: 'BEY', cityNameAr: 'بيروت' },
  IQ: { airportCode: 'BGW', cityNameAr: 'بغداد' },
  YE: { airportCode: 'ADE', cityNameAr: 'عدن' },

  // North Africa
  EG: { airportCode: 'CAI', cityNameAr: 'القاهرة' },
  LY: { airportCode: 'TIP', cityNameAr: 'طرابلس' },
  TN: { airportCode: 'TUN', cityNameAr: 'تونس' },
  DZ: { airportCode: 'ALG', cityNameAr: 'الجزائر' },
  MA: { airportCode: 'CMN', cityNameAr: 'الدار البيضاء' },
  SD: { airportCode: 'KRT', cityNameAr: 'الخرطوم' },

  // Turkey
  TR: { airportCode: 'IST', cityNameAr: 'إسطنبول' },

  // Europe (Syrian diaspora)
  DE: { airportCode: 'BER', cityNameAr: 'برلين' },
  SE: { airportCode: 'ARN', cityNameAr: 'ستوكهولم' },
  NL: { airportCode: 'AMS', cityNameAr: 'أمستردام' },
  FR: { airportCode: 'CDG', cityNameAr: 'باريس' },
  GB: { airportCode: 'LHR', cityNameAr: 'لندن' },
  AT: { airportCode: 'VIE', cityNameAr: 'فيينا' },
  DK: { airportCode: 'CPH', cityNameAr: 'كوبنهاغن' },
  NO: { airportCode: 'OSL', cityNameAr: 'أوسلو' },
  BE: { airportCode: 'BRU', cityNameAr: 'بروكسل' },
  CH: { airportCode: 'ZRH', cityNameAr: 'زيوريخ' },
  GR: { airportCode: 'ATH', cityNameAr: 'أثينا' },
  IT: { airportCode: 'FCO', cityNameAr: 'روما' },
  ES: { airportCode: 'MAD', cityNameAr: 'مدريد' },

  // Russia & CIS
  RU: { airportCode: 'SVO', cityNameAr: 'موسكو' },

  // Americas
  US: { airportCode: 'JFK', cityNameAr: 'نيويورك' },
  CA: { airportCode: 'YYZ', cityNameAr: 'تورنتو' },
  BR: { airportCode: 'GRU', cityNameAr: 'ساو باولو' },

  // Asia
  MY: { airportCode: 'KUL', cityNameAr: 'كوالالمبور' },
  CN: { airportCode: 'PEK', cityNameAr: 'بكين' },
};

export const DEFAULT_GEO: GeoEntry = {
  airportCode: 'DXB',
  cityNameAr: 'دبي',
};
