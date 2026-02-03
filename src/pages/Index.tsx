import { useState, useEffect, useMemo, useRef } from "react";
import { Plane, Loader2, ArrowLeftRight, ExternalLink, ChevronDown, Check, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDestinations, useDamascusFlights } from "@/hooks/useFlights";
import type { Flight, Destination } from "@/types/flight";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Map countries to their likely airport codes
const countryToAirport: Record<string, string> = {
  'AE': 'DXB', 'QA': 'DOH', 'SA': 'JED', 'KW': 'KWI', 'BH': 'BAH',
  'OM': 'MCT', 'JO': 'AMM', 'LB': 'BEY', 'EG': 'CAI', 'TR': 'IST',
  'IQ': 'BGW', 'RU': 'SVO',
};

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const Index = () => {
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [tripDirection, setTripDirection] = useState<'to' | 'from'>('to');
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [passengers, setPassengers] = useState(1);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');
  const [tripTypeOpen, setTripTypeOpen] = useState(false);
  const [classType, setClassType] = useState<'economy' | 'premium' | 'business' | 'first'>('economy');
  const [classTypeOpen, setClassTypeOpen] = useState(false);
  
  const calendarSectionRef = useRef<HTMLDivElement>(null);
  
  const { data: destinations } = useDestinations();
  const { data: flights, isLoading: flightsLoading } = useDamascusFlights(
    tripDirection === 'to' ? 'to' : 'from',
    userLocation || undefined
  );
  
  const scrollToCalendar = () => {
    calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Non-Damascus destinations
  const otherDestinations = useMemo(() => {
    return destinations?.filter(d => d.airport_code !== 'DAM') || [];
  }, [destinations]);

  // Detect user location
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code === 'SY') {
          setUserLocation('DXB');
          setTripDirection('from');
        } else if (data.country_code && countryToAirport[data.country_code]) {
          setUserLocation(countryToAirport[data.country_code]);
        } else {
          setUserLocation('DXB');
        }
      } catch (error) {
        setUserLocation('DXB');
      } finally {
        setIsDetecting(false);
      }
    };
    detectLocation();
  }, []);

  const userDestination = useMemo(() => {
    return destinations?.find(d => d.airport_code === userLocation);
  }, [destinations, userLocation]);

  const toggleDirection = () => {
    setTripDirection(prev => prev === 'to' ? 'from' : 'to');
  };

  const handleSelectCity = (code: string) => {
    setUserLocation(code);
    setCityPickerOpen(false);
  };

  // Get cheapest flight for display
  const cheapestFlight = useMemo(() => {
    if (!flights || flights.length === 0) return null;
    return flights.reduce((min, flight) => 
      (flight.price_usd && (!min.price_usd || flight.price_usd < min.price_usd)) ? flight : min
    , flights[0]);
  }, [flights]);

  const classLabels = {
    economy: 'اقتصادي',
    premium: 'اقتصادي ممتاز',
    business: 'أعمال',
    first: 'درجة أولى'
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Hero Section - Google Flights Style */}
      <div className="relative">
        {/* Decorative Background - Google Flights Style */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[320px] bg-gradient-to-b from-[#e8f0fe] to-white" />
          <svg 
            className="absolute top-0 left-0 right-0 w-full h-[320px] opacity-60"
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
          >
            {/* Mountains/Landscape SVG inspired by Google Flights */}
            <path 
              fill="#c4d7f5" 
              d="M0,192 C200,120 400,250 600,180 C800,110 1000,200 1200,160 C1400,120 1440,150 1440,150 L1440,0 L0,0 Z"
              opacity="0.4"
            />
            <path 
              fill="#d4e4fc" 
              d="M0,160 C150,200 350,100 550,160 C750,220 950,140 1150,180 C1350,220 1440,180 1440,180 L1440,0 L0,0 Z"
              opacity="0.3"
            />
          </svg>
          {/* Plane Icon */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2">
            <Plane className="h-12 w-12 text-[#4285f4] opacity-20 -rotate-45" />
          </div>
        </div>

        {/* Simple Header */}
        <header className="relative py-4 px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4285f4] flex items-center justify-center">
                <Plane className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-normal text-[#202124]">رحلات دمشق</span>
            </div>
          </div>
        </header>

        {/* Main Title - Exact Google Flights Style */}
        <div className="relative text-center py-12 pb-8">
          <h1 className="text-[56px] font-normal text-[#202124] tracking-tight" style={{ fontFamily: "'Google Sans', 'Noto Sans Arabic', sans-serif" }}>
            رحلات
          </h1>
        </div>

        {/* Search Card - Google Flights Exact Style */}
        <div className="relative max-w-4xl mx-auto px-4 pb-8">
          <Card className="shadow-[0_1px_6px_rgba(32,33,36,0.28)] border-0 rounded-lg overflow-visible bg-white">
            <CardContent className="p-0">
              {/* Top Row - Trip Type, Passengers, Class */}
              <div className="flex items-center gap-1 p-3 border-b border-[#dadce0]">
                {/* Trip Type Selector */}
                <Popover open={tripTypeOpen} onOpenChange={setTripTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-9 px-3 text-sm font-normal text-[#202124] hover:bg-[#f1f3f4] rounded-md gap-1"
                    >
                      <ArrowLeftRight className="h-4 w-4 text-[#5f6368]" />
                      {tripType === 'roundtrip' ? 'ذهاب وعودة' : 'ذهاب فقط'}
                      <ChevronDown className="h-4 w-4 text-[#5f6368]" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-1" align="start">
                    <button 
                      className="w-full text-right px-3 py-2 text-sm hover:bg-[#f1f3f4] rounded flex items-center gap-2"
                      onClick={() => { setTripType('roundtrip'); setTripTypeOpen(false); }}
                    >
                      {tripType === 'roundtrip' && <Check className="h-4 w-4 text-[#4285f4]" />}
                      <span className={tripType !== 'roundtrip' ? 'mr-6' : ''}>ذهاب وعودة</span>
                    </button>
                    <button 
                      className="w-full text-right px-3 py-2 text-sm hover:bg-[#f1f3f4] rounded flex items-center gap-2"
                      onClick={() => { setTripType('oneway'); setTripTypeOpen(false); }}
                    >
                      {tripType === 'oneway' && <Check className="h-4 w-4 text-[#4285f4]" />}
                      <span className={tripType !== 'oneway' ? 'mr-6' : ''}>ذهاب فقط</span>
                    </button>
                  </PopoverContent>
                </Popover>

                {/* Passengers Selector */}
                <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-9 px-3 text-sm font-normal text-[#202124] hover:bg-[#f1f3f4] rounded-md gap-1"
                    >
                      <Users className="h-4 w-4 text-[#5f6368]" />
                      {passengers}
                      <ChevronDown className="h-4 w-4 text-[#5f6368]" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="start">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#202124]">بالغين</span>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full border-[#dadce0]"
                          onClick={() => setPassengers(Math.max(1, passengers - 1))}
                          disabled={passengers <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center text-sm">{passengers}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full border-[#dadce0]"
                          onClick={() => setPassengers(Math.min(9, passengers + 1))}
                          disabled={passengers >= 9}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4 bg-[#4285f4] hover:bg-[#1a73e8] text-white"
                      onClick={() => setPassengersOpen(false)}
                    >
                      تم
                    </Button>
                  </PopoverContent>
                </Popover>

                {/* Class Selector */}
                <Popover open={classTypeOpen} onOpenChange={setClassTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-9 px-3 text-sm font-normal text-[#202124] hover:bg-[#f1f3f4] rounded-md gap-1"
                    >
                      {classLabels[classType]}
                      <ChevronDown className="h-4 w-4 text-[#5f6368]" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-1" align="start">
                    {Object.entries(classLabels).map(([key, label]) => (
                      <button 
                        key={key}
                        className="w-full text-right px-3 py-2 text-sm hover:bg-[#f1f3f4] rounded flex items-center gap-2"
                        onClick={() => { setClassType(key as any); setClassTypeOpen(false); }}
                      >
                        {classType === key && <Check className="h-4 w-4 text-[#4285f4]" />}
                        <span className={classType !== key ? 'mr-6' : ''}>{label}</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Main Search Row - Route & Date */}
              <div className="flex items-stretch">
                {/* From Input */}
                <div className="flex-1 border-l border-[#dadce0]">
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border border-[#dadce0] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#9aa0a6]" />
                      </div>
                      {tripDirection === 'to' ? (
                        <CitySelector
                          destinations={otherDestinations}
                          selectedCode={userLocation}
                          onSelect={handleSelectCity}
                          isOpen={cityPickerOpen}
                          setIsOpen={setCityPickerOpen}
                          isDetecting={isDetecting}
                          selectedCity={userDestination}
                          placeholder="من أين؟"
                        />
                      ) : (
                        <div className="flex-1">
                          <span className="text-base text-[#202124]">دمشق</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Swap Button - Floating Style */}
                <div className="relative flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-1/2 -translate-x-1/2 z-10 rounded-full h-10 w-10 bg-white border-[#dadce0] hover:bg-[#f1f3f4] shadow-sm"
                    onClick={toggleDirection}
                  >
                    <ArrowLeftRight className="h-4 w-4 text-[#5f6368]" />
                  </Button>
                </div>

                {/* To Input */}
                <div className="flex-1 border-l border-[#dadce0]">
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border border-[#dadce0] flex items-center justify-center bg-[#4285f4]">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      {tripDirection === 'from' ? (
                        <CitySelector
                          destinations={otherDestinations}
                          selectedCode={userLocation}
                          onSelect={handleSelectCity}
                          isOpen={cityPickerOpen}
                          setIsOpen={setCityPickerOpen}
                          isDetecting={isDetecting}
                          selectedCity={userDestination}
                          placeholder="إلى أين؟"
                        />
                      ) : (
                        <div className="flex-1">
                          <span className="text-base text-[#202124]">دمشق</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date Pickers */}
                <div className="flex border-[#dadce0]">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button className="px-4 py-3 flex items-center gap-2 hover:bg-[#f1f3f4] transition-colors border-r border-[#dadce0]">
                        <CalendarIcon className="h-5 w-5 text-[#5f6368]" />
                        <div className="text-right">
                          <span className="text-sm text-[#202124]">
                            {format(selectedDate, "d MMM", { locale: ar })}
                          </span>
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date);
                            setDatePickerOpen(false);
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {tripType === 'roundtrip' && (
                    <button className="px-4 py-3 flex items-center gap-2 hover:bg-[#f1f3f4] transition-colors text-[#5f6368] text-sm">
                      العودة
                    </button>
                  )}
                </div>
              </div>

              {/* Search Button - Centered at Bottom */}
              <div className="flex justify-center -mb-6 relative z-10">
                <Button 
                  className="h-12 px-8 rounded-full bg-[#4285f4] hover:bg-[#1a73e8] text-white shadow-md text-base font-normal gap-2"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                  استكشف
                </Button>
              </div>

              {/* Location Detection */}
              {isDetecting && (
                <div className="flex items-center justify-center gap-2 py-3 bg-[#f1f3f4] mt-6">
                  <Loader2 className="h-4 w-4 animate-spin text-[#4285f4]" />
                  <span className="text-sm text-[#5f6368]">جاري تحديد موقعك...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deals Banner - Google Flights AI Style */}
      <div className="max-w-4xl mx-auto px-4 mt-12">
        <DealsBanner 
          userCity={userDestination?.city_ar || 'موقعك'}
          cheapestPrice={cheapestFlight?.price_usd}
          onScrollToCalendar={scrollToCalendar}
        />
      </div>

      {/* Popular Destinations Section - Google Flights Style */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        {/* Section Title */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-normal text-[#202124]">
            ابحث عن رحلات رخيصة من {userDestination?.city_ar || 'موقعك'} إلى دمشق
          </h2>
        </div>

        {/* City Chips */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {otherDestinations.slice(0, 4).map((dest) => (
            <button
              key={dest.id}
              className={cn(
                "px-4 py-2 rounded-full text-sm border transition-colors",
                userLocation === dest.airport_code 
                  ? "bg-[#e8f0fe] border-[#4285f4] text-[#1a73e8]" 
                  : "bg-white border-[#dadce0] text-[#202124] hover:bg-[#f1f3f4]"
              )}
              onClick={() => handleSelectCity(dest.airport_code)}
            >
              {dest.city_ar}
            </button>
          ))}
        </div>

        {/* Flight Cards - Google Flights Style */}
        <div className="grid gap-4 mb-12">
          {flightsLoading ? (
            <Card className="py-16 border-[#dadce0]">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#4285f4] mb-4" />
                <p className="text-[#5f6368]">جاري البحث عن أفضل الرحلات...</p>
              </div>
            </Card>
          ) : flights && flights.length > 0 ? (
            flights.slice(0, 3).map((flight) => (
              <FlightCard 
                key={flight.id} 
                flight={flight} 
                cheapestPrice={cheapestFlight?.price_usd}
                passengers={passengers}
              />
            ))
          ) : (
            <Card className="py-16 text-center border-[#dadce0] border-dashed">
              <Plane className="h-12 w-12 text-[#dadce0] mx-auto mb-4" />
              <p className="text-[#5f6368]">لا توجد رحلات متاحة حالياً</p>
              <p className="text-sm text-[#9aa0a6] mt-1">جرب اختيار مدينة أخرى</p>
            </Card>
          )}
        </div>

        {/* Cheapest Flights Calendar Section */}
        <div ref={calendarSectionRef}>
          <CheapestFlightsSection 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            flights={flights}
            userCity={userDestination?.city_ar || 'موقعك'}
          />
        </div>
      </main>

      {/* Footer - Simple */}
      <footer className="py-8 text-center border-t border-[#dadce0] mt-12">
        <p className="text-sm text-[#5f6368]">
          © {new Date().getFullYear()} رحلات دمشق
        </p>
      </footer>
    </div>
  );
};

// City Selector Component - Google Flights Style
function CitySelector({
  destinations,
  selectedCode,
  onSelect,
  isOpen,
  setIsOpen,
  isDetecting,
  selectedCity,
  placeholder = "اختر مدينة",
}: {
  destinations: Destination[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isDetecting: boolean;
  selectedCity?: Destination;
  placeholder?: string;
}) {
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex-1 text-right hover:text-[#4285f4] transition-colors">
          <span className="text-base text-[#202124]">
            {isDetecting ? 'جاري التحديد...' : (selectedCity?.city_ar || placeholder)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-0 shadow-[0_1px_6px_rgba(32,33,36,0.28)]" align="start">
        <Command className="rounded-lg">
          <CommandInput placeholder="ابحث عن مدينة..." className="text-right border-0 h-12" />
          <CommandList className="max-h-72">
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
            <CommandGroup>
              {destinations.map((dest) => (
                <CommandItem
                  key={dest.id}
                  value={`${dest.city_ar} ${dest.city} ${dest.airport_code}`}
                  onSelect={() => onSelect(dest.airport_code)}
                  className="flex items-center justify-between cursor-pointer py-3 px-4 hover:bg-[#f1f3f4]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f1f3f4] flex items-center justify-center">
                      <Plane className="h-4 w-4 text-[#5f6368]" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-normal text-[#202124]">{dest.city_ar}</p>
                      <p className="text-xs text-[#5f6368]">{dest.country_ar}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-[#5f6368]">{dest.airport_code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Deals Banner - Google Flights AI Deals Style
function DealsBanner({ 
  userCity, 
  cheapestPrice,
  onScrollToCalendar 
}: { 
  userCity: string;
  cheapestPrice?: number;
  onScrollToCalendar: () => void;
}) {
  const currentMonth = MONTHS_AR[new Date().getMonth()];
  
  return (
    <Card className="border border-[#dadce0] rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Sparkle Icon - Like Google's AI icon */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8ab4f8] to-[#4285f4] flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          
          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-normal text-[#202124]">
                أرخص الرحلات لهذا الشهر
              </h4>
              <Badge className="bg-[#e8f0fe] text-[#1a73e8] border-0 text-xs font-normal px-2 py-0.5">
                جديد
              </Badge>
            </div>
            <p className="text-sm text-[#5f6368]">
              شاهد أفضل الأسعار للرحلات من {userCity} إلى دمشق خلال {currentMonth}
            </p>
          </div>
          
          {/* Button */}
          <Button 
            variant="outline" 
            className="text-[#1a73e8] border-[#dadce0] hover:bg-[#f1f3f4] hover:border-[#1a73e8] flex-shrink-0 font-normal"
            onClick={onScrollToCalendar}
          >
            استكشف العروض
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Flight Card - Google Flights Style
function FlightCard({ flight, cheapestPrice, passengers = 1 }: { flight: Flight; cheapestPrice?: number | null; passengers?: number }) {
  const formatTime = (time: string) => time.slice(0, 5);
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} س ${mins > 0 ? `${mins} د` : ''}`;
  };

  const isCheapest = cheapestPrice && flight.price_usd === cheapestPrice;
  const totalPrice = flight.price_usd ? flight.price_usd * passengers : null;

  return (
    <Card className={cn(
      "border rounded-lg hover:shadow-md transition-all cursor-pointer",
      isCheapest ? "border-[#34a853]" : "border-[#dadce0]"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-6">
          {/* Airline Logo */}
          <div className="w-9 h-9 rounded bg-[#f1f3f4] flex items-center justify-center flex-shrink-0">
            <span className="font-medium text-[#5f6368] text-xs">{flight.airline?.code}</span>
          </div>

          {/* Flight Times */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base text-[#202124]">{formatTime(flight.departure_time)}</span>
              <span className="text-[#5f6368]">–</span>
              <span className="text-base text-[#202124]">{formatTime(flight.arrival_time)}</span>
            </div>
            <p className="text-xs text-[#5f6368]">{flight.airline?.name_ar}</p>
          </div>

          {/* Duration */}
          <div className="text-center">
            <p className="text-sm text-[#202124]">{formatDuration(flight.duration_minutes)}</p>
            <p className="text-xs text-[#5f6368]">{flight.origin?.airport_code}–{flight.destination?.airport_code}</p>
          </div>

          {/* Stops */}
          <div className="text-center min-w-[60px]">
            <p className={cn(
              "text-sm",
              flight.stops === 0 ? "text-[#34a853]" : "text-[#202124]"
            )}>
              {flight.stops === 0 ? "مباشرة" : `${flight.stops} توقف`}
            </p>
          </div>

          {/* Price */}
          <div className="text-left min-w-[80px]">
            <p className={cn(
              "text-base font-medium",
              isCheapest ? "text-[#34a853]" : "text-[#202124]"
            )}>
              {totalPrice ? `$${totalPrice}` : (flight.price_usd ? `$${flight.price_usd}` : '-')}
            </p>
            {passengers > 1 && flight.price_usd && (
              <p className="text-xs text-[#5f6368]">${flight.price_usd} للفرد</p>
            )}
          </div>

          {/* Book Button */}
          {flight.airline?.website_url && (
            <Button 
              asChild 
              className="bg-[#4285f4] hover:bg-[#1a73e8] text-white rounded-md h-9 px-4"
            >
              <a href={flight.airline.website_url} target="_blank" rel="noopener noreferrer" className="gap-1 text-sm font-normal">
                احجز
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Cheapest Flights Section - Google Flights Calendar Style
function CheapestFlightsSection({ 
  selectedMonth, 
  onMonthChange,
  flights,
  userCity
}: { 
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  flights?: Flight[];
  userCity: string;
}) {
  const currentYear = new Date().getFullYear();
  
  // Generate mock calendar data
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
    const data: { day: number; price: number | null }[] = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const hasPrice = Math.random() > 0.3;
      const basePrice = flights?.[0]?.price_usd || 150;
      const price = hasPrice ? Math.floor(basePrice + (Math.random() - 0.5) * 100) : null;
      data.push({ day: i, price });
    }
    return data;
  }, [selectedMonth, flights]);

  const minPrice = useMemo(() => {
    const prices = calendarData.filter(d => d.price !== null).map(d => d.price!);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [calendarData]);

  const handlePrevMonth = () => {
    onMonthChange(selectedMonth === 0 ? 11 : selectedMonth - 1);
  };

  const handleNextMonth = () => {
    onMonthChange(selectedMonth === 11 ? 0 : selectedMonth + 1);
  };

  return (
    <section className="mb-12">
      <Card className="border border-[#dadce0] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#dadce0]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-normal text-[#202124]">
              أرخص الرحلات من {userCity} إلى دمشق
            </h3>
            
            {/* Month Selector */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-[#f1f3f4] rounded-full" 
                onClick={handlePrevMonth}
              >
                <ChevronRight className="h-4 w-4 text-[#5f6368]" />
              </Button>
              <span className="text-sm text-[#202124] min-w-28 text-center">
                {MONTHS_AR[selectedMonth]} {currentYear}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-[#f1f3f4] rounded-full" 
                onClick={handleNextMonth}
              >
                <ChevronLeft className="h-4 w-4 text-[#5f6368]" />
              </Button>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Day Headers */}
            {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((day) => (
              <div key={day} className="text-xs text-[#5f6368] py-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for alignment */}
            {Array.from({ length: new Date(currentYear, selectedMonth, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2"></div>
            ))}
            
            {/* Calendar Days */}
            {calendarData.map(({ day, price }) => (
              <button
                key={day}
                className={cn(
                  "p-2 rounded-lg transition-colors text-center hover:bg-[#f1f3f4]",
                  price === minPrice && "bg-[#e6f4ea] hover:bg-[#ceead6]"
                )}
              >
                <span className="text-sm text-[#202124] block">{day}</span>
                {price ? (
                  <span className={cn(
                    "text-xs",
                    price === minPrice ? "text-[#137333] font-medium" : "text-[#5f6368]"
                  )}>
                    ${price}
                  </span>
                ) : (
                  <span className="text-xs text-[#dadce0]">—</span>
                )}
              </button>
            ))}
          </div>
          
          {/* Legend */}
          {minPrice && (
            <div className="mt-4 pt-4 border-t border-[#dadce0] flex items-center justify-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-[#e6f4ea]"></div>
              <span className="text-[#5f6368]">أرخص سعر: <span className="text-[#137333] font-medium">${minPrice}</span></span>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default Index;
