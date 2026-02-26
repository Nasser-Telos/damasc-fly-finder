import { z } from 'zod';

const englishNameRegex = /^[a-zA-Z\s\-']+$/;

export const bookingPassengerSchema = z.object({
  given_name: z
    .string()
    .min(1, 'الاسم الأول مطلوب')
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .regex(englishNameRegex, 'يرجى إدخال الاسم بالأحرف الإنجليزية فقط'),
  family_name: z
    .string()
    .min(1, 'اسم العائلة مطلوب')
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .regex(englishNameRegex, 'يرجى إدخال الاسم بالأحرف الإنجليزية فقط'),
  born_on: z
    .string()
    .min(1, 'تاريخ الميلاد مطلوب')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ غير صحيحة'),
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صالح'),
  phone_number: z
    .string()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(/^\+?[\d\s\-()]{7,}$/, 'رقم الهاتف غير صالح'),
  gender: z.enum(['m', 'f'], {
    required_error: 'يرجى اختيار الجنس',
  }),
  title: z.enum(['mr', 'ms', 'mrs'], {
    required_error: 'يرجى اختيار اللقب',
  }),
  passport_number: z
    .string()
    .min(1, 'رقم جواز السفر مطلوب')
    .min(5, 'رقم الجواز يجب أن يكون 5 أحرف على الأقل'),
  passport_expiry: z
    .string()
    .min(1, 'تاريخ انتهاء الجواز مطلوب')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ غير صحيحة'),
  nationality: z
    .string()
    .min(1, 'الجنسية مطلوبة')
    .regex(/^[A-Z]{2}$/, 'يرجى اختيار الجنسية'),
  issuance_country: z
    .string()
    .min(1, 'بلد الإصدار مطلوب')
    .regex(/^[A-Z]{2}$/, 'يرجى اختيار بلد الإصدار'),
  address_line: z.string().optional().default(''),
  city: z.string().optional().default(''),
  postal_code: z.string().optional().default(''),
});

export type BookingFormData = z.infer<typeof bookingPassengerSchema>;
