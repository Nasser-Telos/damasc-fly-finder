import { useState, useEffect, useMemo } from "react";
import { Plane, Loader2, ArrowLeftRight, ExternalLink, ChevronDown, Check, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, Minus, Plus } from "lucide-react";
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
  
  const { data: destinations } = useDestinations();
  const { data: flights, isLoading: flightsLoading } = useDamascusFlights(
    tripDirection === 'to' ? 'to' : 'from',
    userLocation || undefined
  );

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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero Section - Google Flights Style */}
      <div className="relative bg-muted/30 pb-24">
        {/* Simple Header */}
        <header className="py-6 px-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-medium text-foreground">رحلات دمشق</h1>
          </div>
        </header>

        {/* Main Title */}
        <div className="text-center py-8">
          <h2 className="text-4xl md:text-5xl font-normal text-foreground">رحلات</h2>
        </div>

        {/* Search Card - Floating */}
        <div className="max-w-3xl mx-auto px-4">
          <Card className="shadow-lg border-0 rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Route Selection */}
              <div className="flex items-center border-b">
                {/* From */}
                <div className="flex-1 p-4 border-l">
                  <p className="text-xs text-muted-foreground mb-1">من أين؟</p>
                  {tripDirection === 'to' ? (
                    <CitySelector
                      destinations={otherDestinations}
                      selectedCode={userLocation}
                      onSelect={handleSelectCity}
                      isOpen={cityPickerOpen}
                      setIsOpen={setCityPickerOpen}
                      isDetecting={isDetecting}
                      selectedCity={userDestination}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">دمشق</span>
                      <span className="text-sm text-muted-foreground">DAM</span>
                    </div>
                  )}
                </div>

                {/* Swap Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 mx-2 hover:bg-muted"
                  onClick={toggleDirection}
                >
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                </Button>

                {/* To */}
                <div className="flex-1 p-4">
                  <p className="text-xs text-muted-foreground mb-1">إلى أين؟</p>
                  {tripDirection === 'from' ? (
                    <CitySelector
                      destinations={otherDestinations}
                      selectedCode={userLocation}
                      onSelect={handleSelectCity}
                      isOpen={cityPickerOpen}
                      setIsOpen={setCityPickerOpen}
                      isDetecting={isDetecting}
                      selectedCity={userDestination}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">دمشق</span>
                      <span className="text-sm text-muted-foreground">DAM</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Passengers Row */}
              <div className="flex items-center border-b">
                {/* Date Picker */}
                <div className="flex-1 p-4 border-l">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-3 w-full hover:bg-muted/50 rounded-lg transition-colors p-2 -m-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">التاريخ</p>
                          <p className="font-medium">
                            {format(selectedDate, "d MMMM", { locale: ar })}
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
                </div>

                {/* Passengers Selector */}
                <div className="flex-1 p-4">
                  <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-3 w-full hover:bg-muted/50 rounded-lg transition-colors p-2 -m-2">
                        <Users className="h-5 w-5 text-primary" />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">المسافرين</p>
                          <p className="font-medium">
                            {passengers} {passengers === 1 ? 'مسافر' : 'مسافرين'}
                          </p>
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">بالغين</span>
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
                          <span className="w-6 text-center font-bold">{passengers}</span>
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
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Location Detection */}
              {isDetecting && (
                <div className="flex items-center justify-center gap-2 py-3 bg-muted/50">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">جاري تحديد موقعك...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 -mt-8">
        {/* Search Summary */}
        <div className="bg-card rounded-lg shadow-sm p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">
              {tripDirection === 'to' ? (userDestination?.city_ar || 'موقعك') : 'دمشق'}
            </span>
            <span className="text-muted-foreground">←</span>
            <span className="font-medium">
              {tripDirection === 'to' ? 'دمشق' : (userDestination?.city_ar || 'موقعك')}
            </span>
            <span className="text-muted-foreground">•</span>
            <span>{format(selectedDate, "d MMMM", { locale: ar })}</span>
            <span className="text-muted-foreground">•</span>
            <span>{passengers} {passengers === 1 ? 'مسافر' : 'مسافرين'}</span>
          </div>
          {passengers > 1 && cheapestFlight?.price_usd && (
            <Badge variant="outline" className="text-primary border-primary/30">
              الإجمالي من ${cheapestFlight.price_usd * passengers}
            </Badge>
          )}
        </div>

        {/* Flights List */}
        <div className="space-y-3 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">
              {flightsLoading ? 'جاري البحث...' : `${flights?.length || 0} رحلة متاحة`}
            </h3>
            {cheapestFlight?.price_usd && (
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-0">
                أرخص سعر: ${cheapestFlight.price_usd}
              </Badge>
            )}
          </div>

          {flightsLoading ? (
            <Card className="py-16">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">جاري البحث عن أفضل الرحلات...</p>
              </div>
            </Card>
          ) : flights && flights.length > 0 ? (
            flights.map((flight) => (
              <FlightCard 
                key={flight.id} 
                flight={flight} 
                cheapestPrice={cheapestFlight?.price_usd}
                passengers={passengers}
              />
            ))
          ) : (
            <Card className="py-16 text-center border-dashed">
              <Plane className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد رحلات متاحة حالياً</p>
              <p className="text-sm text-muted-foreground mt-1">جرب اختيار مدينة أخرى</p>
            </Card>
          )}
        </div>

        {/* Cheapest Flights Calendar Section */}
        <CheapestFlightsSection 
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          flights={flights}
          userCity={userDestination?.city_ar || 'موقعك'}
        />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t bg-muted/20">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} رحلات دمشق
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
}: {
  destinations: Destination[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isDetecting: boolean;
  selectedCity?: Destination;
}) {
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 hover:text-primary transition-colors text-right">
          <div>
            <span className="text-lg font-medium block">
              {isDetecting ? 'جاري التحديد...' : (selectedCity?.city_ar || 'اختر مدينة')}
            </span>
            <span className="text-sm text-muted-foreground">
              {selectedCode || '...'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="ابحث عن مدينة..." className="text-right" />
          <CommandList>
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
            <CommandGroup>
              {destinations.map((dest) => (
                <CommandItem
                  key={dest.id}
                  value={`${dest.city_ar} ${dest.city} ${dest.airport_code}`}
                  onSelect={() => onSelect(dest.airport_code)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary",
                        selectedCode === dest.airport_code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="text-right">
                      <p className="font-medium">{dest.city_ar}</p>
                      <p className="text-xs text-muted-foreground">{dest.country_ar}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-primary">{dest.airport_code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
      "hover:shadow-md transition-all border",
      isCheapest && "ring-2 ring-green-200 border-green-200"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Airline Logo */}
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-primary text-sm">{flight.airline?.code}</span>
          </div>

          {/* Flight Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-lg font-medium">{formatTime(flight.departure_time)}</span>
              <div className="flex-1 flex items-center gap-1 px-2">
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-xs text-muted-foreground px-1">{formatDuration(flight.duration_minutes)}</span>
                <div className="h-px flex-1 bg-border"></div>
              </div>
              <span className="text-lg font-medium">{formatTime(flight.arrival_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{flight.airline?.name_ar}</span>
              <span>•</span>
              <Badge variant={flight.stops === 0 ? "default" : "secondary"} className="text-xs h-5">
                {flight.stops === 0 ? "مباشرة" : `${flight.stops} توقف`}
              </Badge>
            </div>
          </div>

          {/* Price & Book */}
          <div className="text-left flex-shrink-0">
            {passengers > 1 && totalPrice ? (
              <div>
                <p className="text-xs text-muted-foreground">
                  ${flight.price_usd} × {passengers}
                </p>
                <p className={cn(
                  "text-xl font-bold",
                  isCheapest ? "text-green-600" : "text-foreground"
                )}>
                  ${totalPrice}
                </p>
              </div>
            ) : (
              <p className={cn(
                "text-xl font-bold",
                isCheapest ? "text-green-600" : "text-foreground"
              )}>
                {flight.price_usd ? `$${flight.price_usd}` : '-'}
              </p>
            )}
            {flight.airline?.website_url && (
              <Button asChild size="sm" className="mt-2">
                <a href={flight.airline.website_url} target="_blank" rel="noopener noreferrer">
                  احجز
                  <ExternalLink className="h-3 w-3 mr-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Cheapest Flights Section
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
  
  // Generate mock calendar data (in real app, this would come from API)
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
    const data: { day: number; price: number | null }[] = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      // Mock prices - in real app, get from database
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
      <Card className="overflow-hidden">
        <div className="bg-muted/50 p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-medium">أرخص الرحلات من {userCity} إلى دمشق</h3>
            </div>
            
            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-24 text-center">
                {MONTHS_AR[selectedMonth]} {currentYear}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Day Headers */}
            {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((day) => (
              <div key={day} className="text-xs text-muted-foreground py-2 font-medium">
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
                  "p-2 rounded-lg transition-colors text-center hover:bg-muted",
                  price === minPrice && "bg-green-50 hover:bg-green-100"
                )}
              >
                <span className="text-sm font-medium block">{day}</span>
                {price ? (
                  <span className={cn(
                    "text-xs",
                    price === minPrice ? "text-green-600 font-bold" : "text-muted-foreground"
                  )}>
                    ${price}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/50">-</span>
                )}
              </button>
            ))}
          </div>
          
          {/* Legend */}
          {minPrice && (
            <div className="mt-4 pt-4 border-t flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-100"></div>
                <span className="text-muted-foreground">أرخص سعر: ${minPrice}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default Index;
