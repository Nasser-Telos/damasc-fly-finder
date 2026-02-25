export interface BookingPassenger {
  given_name: string;
  family_name: string;
  born_on: string;
  email: string;
  phone_number: string;
  gender: 'm' | 'f';
  title: 'mr' | 'ms' | 'mrs';
}
