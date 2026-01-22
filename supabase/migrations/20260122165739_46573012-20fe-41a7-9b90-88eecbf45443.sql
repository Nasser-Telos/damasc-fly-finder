-- Create airlines table
CREATE TABLE public.airlines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    website_url TEXT,
    country TEXT,
    description TEXT,
    description_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create destinations table
CREATE TABLE public.destinations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    city TEXT NOT NULL,
    city_ar TEXT NOT NULL,
    country TEXT NOT NULL,
    country_ar TEXT NOT NULL,
    airport_code TEXT NOT NULL UNIQUE,
    airport_name TEXT,
    airport_name_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flights table
CREATE TABLE public.flights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    airline_id UUID REFERENCES public.airlines(id) ON DELETE CASCADE NOT NULL,
    origin_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
    flight_number TEXT NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price_usd DECIMAL(10, 2),
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
    stops INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

-- Create public read policies (informational site - public access)
CREATE POLICY "Anyone can view airlines" ON public.airlines FOR SELECT USING (true);
CREATE POLICY "Anyone can view destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Anyone can view flights" ON public.flights FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_airlines_updated_at
    BEFORE UPDATE ON public.airlines
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flights_updated_at
    BEFORE UPDATE ON public.flights
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial airlines data
INSERT INTO public.airlines (name, name_ar, code, logo_url, website_url, country, description, description_ar) VALUES
('Syrian Air', 'الخطوط الجوية السورية', 'RB', NULL, 'https://syriaair.com', 'Syria', 'National carrier of Syria', 'الناقل الوطني السوري'),
('Cham Wings Airlines', 'أجنحة الشام للطيران', 'SAW', NULL, 'https://chamwings.com', 'Syria', 'Private Syrian airline', 'شركة طيران سورية خاصة'),
('FlyDamas', 'فلاي دمشق', 'FD', NULL, 'https://flydamas.com', 'Syria', 'Syrian charter airline', 'شركة طيران سورية للرحلات المستأجرة'),
('Emirates', 'طيران الإمارات', 'EK', NULL, 'https://emirates.com', 'UAE', 'Premium UAE carrier', 'الناقل الإماراتي الفاخر'),
('flydubai', 'فلاي دبي', 'FZ', NULL, 'https://flydubai.com', 'UAE', 'Low-cost UAE carrier', 'شركة طيران إماراتية اقتصادية'),
('Air Arabia', 'العربية للطيران', 'G9', NULL, 'https://airarabia.com', 'UAE', 'Low-cost carrier based in Sharjah', 'شركة طيران اقتصادية مقرها الشارقة'),
('Qatar Airways', 'الخطوط الجوية القطرية', 'QR', NULL, 'https://qatarairways.com', 'Qatar', 'National carrier of Qatar', 'الناقل الوطني القطري'),
('Gulf Air', 'طيران الخليج', 'GF', NULL, 'https://gulfair.com', 'Bahrain', 'National carrier of Bahrain', 'الناقل الوطني البحريني'),
('Middle East Airlines', 'طيران الشرق الأوسط', 'ME', NULL, 'https://mea.com.lb', 'Lebanon', 'National carrier of Lebanon', 'الناقل الوطني اللبناني'),
('Royal Jordanian', 'الملكية الأردنية', 'RJ', NULL, 'https://rj.com', 'Jordan', 'National carrier of Jordan', 'الناقل الوطني الأردني'),
('Turkish Airlines', 'الخطوط الجوية التركية', 'TK', NULL, 'https://turkishairlines.com', 'Turkey', 'National carrier of Turkey', 'الناقل الوطني التركي'),
('Etihad Airways', 'الاتحاد للطيران', 'EY', NULL, 'https://etihad.com', 'UAE', 'National carrier of Abu Dhabi', 'الناقل الوطني لأبوظبي');

-- Insert initial destinations data
INSERT INTO public.destinations (city, city_ar, country, country_ar, airport_code, airport_name, airport_name_ar) VALUES
('Damascus', 'دمشق', 'Syria', 'سوريا', 'DAM', 'Damascus International Airport', 'مطار دمشق الدولي'),
('Dubai', 'دبي', 'UAE', 'الإمارات', 'DXB', 'Dubai International Airport', 'مطار دبي الدولي'),
('Sharjah', 'الشارقة', 'UAE', 'الإمارات', 'SHJ', 'Sharjah International Airport', 'مطار الشارقة الدولي'),
('Abu Dhabi', 'أبو ظبي', 'UAE', 'الإمارات', 'AUH', 'Abu Dhabi International Airport', 'مطار أبوظبي الدولي'),
('Doha', 'الدوحة', 'Qatar', 'قطر', 'DOH', 'Hamad International Airport', 'مطار حمد الدولي'),
('Beirut', 'بيروت', 'Lebanon', 'لبنان', 'BEY', 'Beirut-Rafic Hariri International Airport', 'مطار رفيق الحريري الدولي'),
('Amman', 'عمّان', 'Jordan', 'الأردن', 'AMM', 'Queen Alia International Airport', 'مطار الملكة علياء الدولي'),
('Istanbul', 'إسطنبول', 'Turkey', 'تركيا', 'IST', 'Istanbul Airport', 'مطار إسطنبول'),
('Cairo', 'القاهرة', 'Egypt', 'مصر', 'CAI', 'Cairo International Airport', 'مطار القاهرة الدولي'),
('Kuwait City', 'مدينة الكويت', 'Kuwait', 'الكويت', 'KWI', 'Kuwait International Airport', 'مطار الكويت الدولي'),
('Manama', 'المنامة', 'Bahrain', 'البحرين', 'BAH', 'Bahrain International Airport', 'مطار البحرين الدولي'),
('Muscat', 'مسقط', 'Oman', 'عُمان', 'MCT', 'Muscat International Airport', 'مطار مسقط الدولي'),
('Jeddah', 'جدة', 'Saudi Arabia', 'السعودية', 'JED', 'King Abdulaziz International Airport', 'مطار الملك عبدالعزيز الدولي'),
('Riyadh', 'الرياض', 'Saudi Arabia', 'السعودية', 'RUH', 'King Khalid International Airport', 'مطار الملك خالد الدولي'),
('Baghdad', 'بغداد', 'Iraq', 'العراق', 'BGW', 'Baghdad International Airport', 'مطار بغداد الدولي'),
('Moscow', 'موسكو', 'Russia', 'روسيا', 'SVO', 'Sheremetyevo International Airport', 'مطار شيريميتيفو الدولي');