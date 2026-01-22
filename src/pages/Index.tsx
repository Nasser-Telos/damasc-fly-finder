import { useState, useEffect, useMemo } from "react";
import { Plane, Loader2, ArrowLeftRight, ExternalLink, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDestinations, useDamascusFlights } from "@/hooks/useFlights";
import type { Flight, Destination } from "@/types/flight";

// Map countries to their likely airport codes
const countryToAirport: Record<string, string> = {
  'AE': 'DXB', // UAE -> Dubai
  'QA': 'DOH', // Qatar -> Doha
  'SA': 'JED', // Saudi -> Jeddah
  'KW': 'KWI', // Kuwait
  'BH': 'BAH', // Bahrain
  'OM': 'MCT', // Oman
  'JO': 'AMM', // Jordan
  'LB': 'BEY', // Lebanon
  'EG': 'CAI', // Egypt
  'TR': 'IST', // Turkey
  'IQ': 'BGW', // Iraq
  'RU': 'SVO', // Russia
};

const Index = () => {
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [detectedCity, setDetectedCity] = useState<string>("");
  const [isDetecting, setIsDetecting] = useState(true);
  const [tripDirection, setTripDirection] = useState<'to' | 'from'>('to'); // 'to' = to Damascus
  
  const { data: destinations } = useDestinations();
  const { data: flights, isLoading: flightsLoading } = useDamascusFlights(
    tripDirection === 'to' ? 'to' : 'from',
    userLocation || undefined
  );

  // Detect user location
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try to get location from IP
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code && countryToAirport[data.country_code]) {
          setUserLocation(countryToAirport[data.country_code]);
          setDetectedCity(data.city || data.country_name);
        } else if (data.country_code === 'SY') {
          // User is in Syria, default to Dubai as destination
          setUserLocation('DXB');
          setDetectedCity('دمشق');
          setTripDirection('from');
        } else {
          // Default to Dubai if location not detected
          setUserLocation('DXB');
          setDetectedCity('دبي');
        }
      } catch (error) {
        // Default to Dubai on error
        setUserLocation('DXB');
        setDetectedCity('دبي');
      } finally {
        setIsDetecting(false);
      }
    };

    detectLocation();
  }, []);

  // Get destination info
  const userDestination = useMemo(() => {
    return destinations?.find(d => d.airport_code === userLocation);
  }, [destinations, userLocation]);

  const formatTime = (time: string) => time.slice(0, 5);
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}س ${mins > 0 ? `${mins}د` : ''}`;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "اتصل للسعر";
    return `$${price}`;
  };

  const toggleDirection = () => {
    setTripDirection(prev => prev === 'to' ? 'from' : 'to');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background" dir="rtl">
      {/* Simple Header */}
      <header className="py-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <Plane className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">رحلات دمشق</h1>
        </div>
        <p className="text-muted-foreground text-sm">ابحث عن رحلتك بسهولة</p>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl px-4 pb-12">
        {/* Route Display */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center">
              {/* From */}
              <div className="flex-1 p-5 text-center">
                <p className="text-xs text-muted-foreground mb-1">من</p>
                <p className="text-xl font-bold">
                  {tripDirection === 'to' ? (userDestination?.city_ar || detectedCity || 'جاري التحديد...') : 'دمشق'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tripDirection === 'to' ? (userLocation || '...') : 'DAM'}
                </p>
              </div>

              {/* Swap Button */}
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12 border-2 flex-shrink-0 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={toggleDirection}
              >
                <ArrowLeftRight className="h-5 w-5" />
              </Button>

              {/* To */}
              <div className="flex-1 p-5 text-center">
                <p className="text-xs text-muted-foreground mb-1">إلى</p>
                <p className="text-xl font-bold">
                  {tripDirection === 'to' ? 'دمشق' : (userDestination?.city_ar || detectedCity || 'جاري التحديد...')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tripDirection === 'to' ? 'DAM' : (userLocation || '...')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Detection Message */}
        {isDetecting && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">جاري تحديد موقعك...</span>
          </div>
        )}

        {/* Flights List */}
        <div className="space-y-3">
          <h2 className="font-bold text-lg mb-4">
            {flightsLoading ? 'جاري البحث...' : `${flights?.length || 0} رحلة متاحة`}
          </h2>

          {flightsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">جاري البحث عن أفضل الرحلات...</p>
            </div>
          ) : flights && flights.length > 0 ? (
            flights.map((flight) => (
              <FlightCard key={flight.id} flight={flight} />
            ))
          ) : (
            <Card className="py-16 text-center">
              <Plane className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد رحلات متاحة حالياً</p>
              <p className="text-sm text-muted-foreground mt-1">سيتم إضافة الرحلات قريباً</p>
            </Card>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center border-t bg-muted/30">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} رحلات دمشق
        </p>
      </footer>
    </div>
  );
};

// Simplified Flight Card
function FlightCard({ flight }: { flight: Flight }) {
  const formatTime = (time: string) => time.slice(0, 5);
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}س ${mins > 0 ? `${mins}د` : ''}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Airline */}
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-primary">{flight.airline?.code}</span>
          </div>

          {/* Flight Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold">{formatTime(flight.departure_time)}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-bold">{formatTime(flight.arrival_time)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(flight.duration_minutes)}
              </span>
              <Badge variant={flight.stops === 0 ? "default" : "secondary"} className="text-xs">
                {flight.stops === 0 ? "مباشرة" : `${flight.stops} توقف`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {flight.airline?.name_ar}
            </p>
          </div>

          {/* Price & Book */}
          <div className="text-left flex-shrink-0">
            <p className="text-xl font-bold text-primary">
              {flight.price_usd ? `$${flight.price_usd}` : '-'}
            </p>
            {flight.airline?.website_url && (
              <Button asChild size="sm" variant="outline" className="mt-2 w-full">
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

export default Index;
