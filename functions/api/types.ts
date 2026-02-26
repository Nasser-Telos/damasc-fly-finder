export interface BookingPassenger {
  given_name: string;
  family_name: string;
  born_on: string;
  email: string;
  phone_number: string;
  gender: 'm' | 'f';
  title: 'mr' | 'ms' | 'mrs';
  passport_number: string;
  passport_expiry: string; // YYYY-MM-DD
  nationality: string; // ISO 3166-1 alpha-2 (e.g. "SY")
  issuance_country: string; // ISO 3166-1 alpha-2 (e.g. "SY")
  address_line?: string;
  city?: string;
  postal_code?: string;
}
