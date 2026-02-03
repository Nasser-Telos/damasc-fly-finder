import { useState, useEffect, useMemo, useRef, forwardRef } from "react";
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
    const searchType = tripDirection === 'to' ? 'to_damascus' : 'from_damascus';
    const params = new URLSearchParams();
    params.set("type", searchType);
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
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  قريباً
                </Badge>
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
        <div className="w-full flex justify-center relative overflow-hidden" style={{ minHeight: '160px' }}>
          {/* Strong gradient overlays for complete seamless blending */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Left fade - stronger */}
            <div 
              className="absolute top-0 bottom-0 left-0 w-24 sm:w-32 md:w-48" 
              style={{ background: 'linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 30%, transparent 100%)' }}
            />
            {/* Right fade - stronger */}
            <div 
              className="absolute top-0 bottom-0 right-0 w-24 sm:w-32 md:w-48" 
              style={{ background: 'linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 30%, transparent 100%)' }}
            />
            {/* Bottom fade - stronger */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-16 sm:h-20" 
              style={{ background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 40%, transparent 100%)' }}
            />
            {/* Top fade - stronger */}
            <div 
              className="absolute top-0 left-0 right-0 h-12 sm:h-16" 
              style={{ background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background)) 40%, transparent 100%)' }}
            />
          </div>
          
          <img 
            src={syriaHeroImage} 
            alt="رحلات سوريا - معالم دمشق وحلب"
            className="w-full max-w-5xl h-auto object-contain"
            style={{ maxHeight: '220px' }}
          />
        </div>

        {/* Title - Like Google Flights */}
        <div className="text-center py-3 sm:py-5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal text-foreground">
            رحلات طيران
          </h1>
        </div>

        {/* Search Card */}
        <div className="relative max-w-4xl mx-auto px-4 pb-8">
          {activeTab === 'aleppo' ? (
            // Aleppo Coming Soon Card
            <Card className="shadow-lg border-0 bg-card">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  رحلات حلب قريباً
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  نعمل على إضافة رحلات من وإلى مطار حلب الدولي. سيتم إضافتها قريباً.
                </p>
              </CardContent>
            </Card>
          ) : (
            // Damascus Search Card - Clean Google Flights Style
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
                      <span className="text-foreground font-medium">دمشق</span>
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
                      <span className="text-foreground font-medium">دمشق</span>
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
          )}
        </div>
      </div>

      {/* Deals Section - Only show for Damascus */}
      {activeTab === 'damascus' && (
        <main className="max-w-4xl mx-auto px-4 mt-12 pb-16">
          {/* Deals Banner */}
          <DealsCard 
            ref={dealsSectionRef}
            userCity={userDestination?.city_ar || 'موقعك'}
            cheapestPrice={cheapestFlight?.price_usd}
            currentMonth={currentMonth}
            tripDirection={tripDirection}
            isLoading={flightsLoading}
            onExplore={handleSearch}
          />
        </main>
      )}

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

// Deals Card Component
const DealsCard = forwardRef<HTMLDivElement, {
  userCity: string;
  cheapestPrice?: number;
  currentMonth: string;
  tripDirection: 'to' | 'from';
  isLoading: boolean;
  onExplore: () => void;
}>(({ userCity, cheapestPrice, currentMonth, tripDirection, isLoading, onExplore }, ref) => {
  const directionText = tripDirection === 'to' 
    ? `من ${userCity} إلى دمشق`
    : `من دمشق إلى ${userCity}`;

  return (
    <div ref={ref}>
      <Card className="border bg-gradient-to-l from-[hsl(217,91%,97%)] to-card hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-base font-medium text-foreground">
                  أرخص الرحلات لهذا الشهر
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {currentMonth}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                شاهد أفضل الأسعار للرحلات {directionText}
              </p>
              
              {/* Price Display */}
              {!isLoading && cheapestPrice && (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground">ابتداءً من</span>
                  <span className="text-2xl font-semibold text-success">${cheapestPrice}</span>
                  <span className="text-sm text-muted-foreground">للفرد</span>
                </div>
              )}
              
              {isLoading && (
                <div className="mt-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">جاري البحث...</span>
                </div>
              )}
            </div>
            
            {/* Button */}
            <Button 
              variant="outline"
              className="flex-shrink-0 text-primary border-primary/30 hover:bg-primary/5"
              onClick={onExplore}
            >
              <Sparkles className="h-4 w-4 ml-2" />
              استكشف الصفقات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
DealsCard.displayName = 'DealsCard';

export default Index;
