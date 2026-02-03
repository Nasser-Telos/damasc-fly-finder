import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Loader2, ArrowLeftRight, ChevronDown, Check, Calendar as CalendarIcon, Users, Minus, Plus, MapPin, Sparkles, Search } from "lucide-react";
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
import { DealsBanner } from "@/components/flight/DealsSection";
import type { Flight, Destination } from "@/types/flight";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import syriaHeroImage from "@/assets/syria-hero-illustration.png";

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

type AirportTab = 'damascus' | 'aleppo';

const Index = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [tripDirection, setTripDirection] = useState<'to' | 'from'>('to');
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [passengers, setPassengers] = useState(1);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');
  const [tripTypeOpen, setTripTypeOpen] = useState(false);
  const [classType, setClassType] = useState<'economy' | 'premium' | 'business' | 'first'>('economy');
  const [classTypeOpen, setClassTypeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AirportTab>('damascus');
  
  const dealsSectionRef = useRef<HTMLDivElement>(null);
  
  const { data: destinations } = useDestinations();
  const { data: flights, isLoading: flightsLoading } = useDamascusFlights(
    tripDirection === 'to' ? 'to' : 'from',
    userLocation || undefined
  );

  // Non-Damascus destinations
  const otherDestinations = useMemo(() => {
    return destinations?.filter(d => d.airport_code !== 'DAM' && d.airport_code !== 'ALP') || [];
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
    economy: 'الدرجة الاقتصادية',
    premium: 'اقتصادي ممتاز',
    business: 'درجة الأعمال',
    first: 'الدرجة الأولى'
  };

  const handleSearch = () => {
    const airportCode = activeTab === 'damascus' ? 'DAM' : 'ALP';
    const searchType = tripDirection === 'to' ? `to_${activeTab}` : `from_${activeTab}`;
    const params = new URLSearchParams();
    params.set("type", searchType);
    params.set("airport", airportCode);
    if (userLocation) {
      params.set("destination", userLocation);
    }
    if (selectedDate) {
      params.set("date", selectedDate.toISOString());
    }
    params.set("passengers", passengers.toString());
    navigate(`/search?${params.toString()}`);
  };

  const scrollToDeals = () => {
    dealsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentMonth = MONTHS_AR[new Date().getMonth()];
  const airportName = activeTab === 'damascus' ? 'دمشق' : 'حلب';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header with Tabs - Google Flights Style */}
      <header className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-normal text-foreground">رحلات سوريا</span>
            </div>
          </div>
          
          {/* Airport Tabs - Like Google's Travel/Explore/Flights/Hotels */}
          <nav className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('damascus')}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors relative",
                activeTab === 'damascus'
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                من وإلى دمشق
              </div>
              {activeTab === 'damascus' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('aleppo')}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors relative",
                activeTab === 'aleppo'
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                من وإلى حلب
              </div>
              {activeTab === 'aleppo' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section with Syrian Illustration - Seamless blend */}
      <div className="relative">
        {/* Hero Image - Seamlessly blended with background */}
        <div className="w-full flex justify-center relative overflow-hidden">
          {/* Gradient overlays for seamless blending (mobile-friendly) */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Mobile fades: lighter so the image stays fully visible */}
            <div className="sm:hidden">
              <div
                className="absolute top-0 bottom-0 left-0 w-14"
                style={{
                  background:
                    'linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 40%, transparent 100%)',
                }}
              />
              <div
                className="absolute top-0 bottom-0 right-0 w-14"
                style={{
                  background:
                    'linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 40%, transparent 100%)',
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-10"
                style={{
                  background:
                    'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 22%, transparent 100%)',
                }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-3"
                style={{ background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)' }}
              />
            </div>

            {/* Desktop/tablet fades: stronger to hide edges (trees corners) */}
            <div className="hidden sm:block">
              {/* Left fade - stronger */}
              <div
                className="absolute top-0 bottom-0 left-0 w-[30vw] max-w-[520px]"
                style={{
                  background:
                    'linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 78%, transparent 100%)',
                  filter: 'blur(0.5px)',
                }}
              />
              {/* Right fade - stronger */}
              <div
                className="absolute top-0 bottom-0 right-0 w-[30vw] max-w-[520px]"
                style={{
                  background:
                    'linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 78%, transparent 100%)',
                  filter: 'blur(0.5px)',
                }}
              />
              {/* Bottom fade - stronger */}
              <div
                className="absolute bottom-0 left-0 right-0 h-16 sm:h-20"
                style={{
                  background:
                    'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 40%, transparent 100%)',
                }}
              />
              {/* Bottom-left corner fade (trees area) */}
              <div
                className="absolute bottom-0 left-0 w-40 sm:w-56 md:w-72 h-28 sm:h-36 md:h-44"
                style={{
                  background:
                    'radial-gradient(ellipse at bottom left, hsl(var(--background)) 0%, hsl(var(--background)) 62%, transparent 78%)',
                }}
              />
              {/* Bottom-right corner fade (trees area) */}
              <div
                className="absolute bottom-0 right-0 w-40 sm:w-56 md:w-72 h-28 sm:h-36 md:h-44"
                style={{
                  background:
                    'radial-gradient(ellipse at bottom right, hsl(var(--background)) 0%, hsl(var(--background)) 62%, transparent 78%)',
                }}
              />
              {/* Top fade - subtle to show airplane */}
              <div
                className="absolute top-0 left-0 right-0 h-4 sm:h-6"
                style={{ background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)' }}
              />
            </div>
          </div>

          <img
            src={syriaHeroImage}
            alt="رحلات سوريا - معالم دمشق وحلب"
            className="w-full max-w-5xl h-auto object-contain max-h-[240px] sm:max-h-[220px]"
          />
        </div>

        {/* Title - Like Google Flights */}
        <div className="text-center py-3 sm:py-5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-normal text-foreground">
            كل شركات الطيران... بنقرة واحدة
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            ابحث مرة. قارن الكل. احجز الأفضل.
          </p>
        </div>

        {/* Search Card - Same design for Damascus and Aleppo */}
        <div className="relative max-w-4xl mx-auto px-4 pb-8">
          <Card className="shadow-lg border border-border bg-card rounded-lg overflow-hidden">
              {/* Top Row - Trip Options */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                {/* Trip Type */}
                <Popover open={tripTypeOpen} onOpenChange={setTripTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm font-normal">
                      <ArrowLeftRight className="h-4 w-4" />
                      {tripType === 'roundtrip' ? 'ذهاب وعودة' : 'ذهاب فقط'}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-1" align="start">
                    <button 
                      className="w-full text-right px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2"
                      onClick={() => { setTripType('roundtrip'); setTripTypeOpen(false); }}
                    >
                      {tripType === 'roundtrip' && <Check className="h-4 w-4 text-primary" />}
                      <span className={tripType !== 'roundtrip' ? 'mr-6' : ''}>ذهاب وعودة</span>
                    </button>
                    <button 
                      className="w-full text-right px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2"
                      onClick={() => { setTripType('oneway'); setTripTypeOpen(false); }}
                    >
                      {tripType === 'oneway' && <Check className="h-4 w-4 text-primary" />}
                      <span className={tripType !== 'oneway' ? 'mr-6' : ''}>ذهاب فقط</span>
                    </button>
                  </PopoverContent>
                </Popover>

                {/* Passengers */}
                <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm font-normal">
                      <Users className="h-4 w-4" />
                      {passengers}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-4" align="start">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">المسافرون</span>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setPassengers(Math.max(1, passengers - 1))}
                          disabled={passengers <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center font-medium">{passengers}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setPassengers(Math.min(9, passengers + 1))}
                          disabled={passengers >= 9}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button className="w-full mt-4" size="sm" onClick={() => setPassengersOpen(false)}>
                      تم
                    </Button>
                  </PopoverContent>
                </Popover>

                {/* Class */}
                <Popover open={classTypeOpen} onOpenChange={setClassTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm font-normal">
                      {classLabels[classType]}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-1" align="start">
                    {Object.entries(classLabels).map(([key, label]) => (
                      <button 
                        key={key}
                        className="w-full text-right px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2"
                        onClick={() => { setClassType(key as any); setClassTypeOpen(false); }}
                      >
                        {classType === key && <Check className="h-4 w-4 text-primary" />}
                        <span className={classType !== key ? 'mr-6' : ''}>{label}</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search Fields */}
              <div className="p-4">
                {/* From/To Row */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0 relative">
                  {/* From Field */}
                  <div className="flex-1 flex items-center gap-3 p-3 border border-border rounded-lg sm:rounded-l-none sm:rounded-r-lg sm:border-l-0 bg-background hover:bg-muted/50 transition-colors">
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
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
                      <span className="text-foreground font-medium">{airportName}</span>
                    )}
                  </div>

                  {/* Swap Button */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden sm:flex">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-9 w-9 bg-card border-border shadow-sm"
                      onClick={toggleDirection}
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile Swap */}
                  <div className="flex sm:hidden justify-center -my-1.5 relative z-10">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-9 w-9 bg-card shadow-sm"
                      onClick={toggleDirection}
                    >
                      <ArrowLeftRight className="h-4 w-4 rotate-90" />
                    </Button>
                  </div>

                  {/* To Field */}
                  <div className="flex-1 flex items-center gap-3 p-3 border border-border rounded-lg sm:rounded-r-none sm:rounded-l-lg bg-background hover:bg-muted/50 transition-colors">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
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
                      <span className="text-foreground font-medium">{airportName}</span>
                    )}
                  </div>
                </div>

                {/* Date Row */}
                <div className="flex gap-3 mt-3">
                  {/* Departure Date */}
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex-1 flex items-center gap-3 p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors text-right">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">المغادرة</p>
                          <p className="text-sm font-medium text-foreground">
                            {format(selectedDate, "EEE، d MMM", { locale: ar })}
                          </p>
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                  
                  {/* Return Date */}
                  {tripType === 'roundtrip' && (
                    <button className="flex-1 flex items-center gap-3 p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors text-right">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">العودة</p>
                        <p className="text-sm text-muted-foreground">إضافة تاريخ</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Loading State */}
                {isDetecting && (
                  <div className="flex items-center justify-center gap-2 mt-3 py-2 bg-muted/50 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">جاري تحديد موقعك...</span>
                  </div>
                )}

                {/* Search Button */}
                <div className="mt-4 flex justify-center">
                  <Button 
                    size="lg"
                    className="h-11 px-10 rounded-full gap-2 font-medium"
                    onClick={handleSearch}
                  >
                    <Search className="h-5 w-5" />
                    ابحث
                  </Button>
                </div>
              </div>
          </Card>
        </div>
      </div>

      {/* Deals Banners */}
      <main className="max-w-4xl mx-auto px-4 mt-12 pb-16 space-y-4" ref={dealsSectionRef}>
        {/* Damascus Deals Banner */}
        <DealsBanner 
          cityName="دمشق"
          onExplore={() => navigate('/search?type=to_damascus&airport=DAM')}
        />
        
        {/* Aleppo Deals Banner */}
        <DealsBanner 
          cityName="حلب"
          onExplore={() => navigate('/search?type=to_aleppo&airport=ALP')}
        />
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center border-t border-border mt-auto">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} رحلات سوريا
        </p>
      </footer>
    </div>
  );
};

// City Selector Component
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
        <button className="flex-1 text-right hover:text-primary transition-colors">
          <span className="text-base text-foreground">
            {isDetecting ? 'جاري التحديد...' : (selectedCity?.city_ar || placeholder)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-lg" align="start">
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
                  className="flex items-center justify-between cursor-pointer py-3 px-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Plane className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-normal">{dest.city_ar}</p>
                      <p className="text-xs text-muted-foreground">{dest.country_ar}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">{dest.airport_code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default Index;
