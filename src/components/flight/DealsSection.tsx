import { Plane, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Flight } from "@/types/flight";
import { useNavigate } from "react-router-dom";

interface DealsSectionProps {
  title: string;
  subtitle: string;
  airportCode: string;
  airportName: string;
  flights: Flight[];
  isLoading: boolean;
  type: 'damascus' | 'aleppo';
}

export function DealsSection({
  title,
  subtitle,
  airportCode,
  airportName,
  flights,
  isLoading,
  type,
}: DealsSectionProps) {
  const navigate = useNavigate();

  // Get unique routes with cheapest prices (max 6)
  const cheapestDeals = (() => {
    if (!flights || flights.length === 0) return [];
    
    const routeMap = new Map<string, Flight>();
    
    flights.forEach((flight) => {
      // Create a unique key for each route (origin-destination pair)
      const routeKey = `${flight.origin?.airport_code}-${flight.destination?.airport_code}`;
      
      const existing = routeMap.get(routeKey);
      if (!existing || (flight.price_usd && existing.price_usd && flight.price_usd < existing.price_usd)) {
        routeMap.set(routeKey, flight);
      }
    });
    
    return Array.from(routeMap.values())
      .filter(f => f.price_usd)
      .sort((a, b) => (a.price_usd || 999) - (b.price_usd || 999))
      .slice(0, 6);
  })();

  const handleViewAll = () => {
    const params = new URLSearchParams();
    params.set("type", `to_${type}`);
    params.set("airport", airportCode);
    navigate(`/search?${params.toString()}`);
  };

  const handleDealClick = (flight: Flight) => {
    const isTo = flight.destination?.airport_code === airportCode;
    const otherCity = isTo ? flight.origin?.airport_code : flight.destination?.airport_code;
    
    const params = new URLSearchParams();
    params.set("type", isTo ? `to_${type}` : `from_${type}`);
    params.set("airport", airportCode);
    if (otherCity) params.set("destination", otherCity);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <Card className="border bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary gap-1"
            onClick={handleViewAll}
          >
            عرض الكل
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">جاري تحميل الصفقات...</span>
          </div>
        ) : cheapestDeals.length === 0 ? (
          <div className="text-center py-8">
            <Plane className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد رحلات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cheapestDeals.map((flight) => (
              <DealCard
                key={flight.id}
                flight={flight}
                airportCode={airportCode}
                airportName={airportName}
                onClick={() => handleDealClick(flight)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DealCardProps {
  flight: Flight;
  airportCode: string;
  airportName: string;
  onClick: () => void;
}

function DealCard({ flight, airportCode, airportName, onClick }: DealCardProps) {
  const isToSyria = flight.destination?.airport_code === airportCode;
  
  const fromCity = isToSyria ? flight.origin?.city_ar : airportName;
  const toCity = isToSyria ? airportName : flight.destination?.city_ar;
  const fromCode = isToSyria ? flight.origin?.airport_code : airportCode;
  const toCode = isToSyria ? airportCode : flight.destination?.airport_code;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col p-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all text-right w-full"
    >
      {/* Route */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-foreground">{fromCity}</span>
          <span className="text-muted-foreground text-xs">({fromCode})</span>
        </div>
        <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-foreground">{toCity}</span>
          <span className="text-muted-foreground text-xs">({toCode})</span>
        </div>
      </div>
      
      {/* Airline & Price */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              {flight.airline?.code}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{flight.airline?.name_ar}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-lg font-semibold text-success">
            ${flight.price_usd}
          </span>
          {flight.stops === 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              مباشرة
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
