import { Plane, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Flight } from "@/types/flight";

interface FlightCardProps {
  flight: Flight;
}

export function FlightCard({ flight }: FlightCardProps) {
  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}س ${mins}د`;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "اتصل للسعر";
    return `$${price.toLocaleString()}`;
  };

  return (
    <Card className="hover:shadow-flight transition-all duration-300 border-border/50 overflow-hidden group">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Airline Info */}
          <div className="bg-muted/30 p-4 lg:p-6 lg:w-48 flex items-center gap-4 lg:flex-col lg:justify-center border-b lg:border-b-0 lg:border-l">
            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg lg:text-xl font-bold text-primary">
                {flight.airline?.code}
              </span>
            </div>
            <div className="lg:text-center">
              <p className="font-semibold text-sm lg:text-base">
                {flight.airline?.name_ar}
              </p>
              <p className="text-xs text-muted-foreground">
                {flight.flight_number}
              </p>
            </div>
          </div>

          {/* Flight Details */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Departure */}
              <div className="flex-1 text-center sm:text-right">
                <p className="text-2xl lg:text-3xl font-bold">
                  {formatTime(flight.departure_time)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {flight.origin?.city_ar}
                </p>
                <p className="text-xs text-muted-foreground">
                  {flight.origin?.airport_code}
                </p>
              </div>

              {/* Duration & Stops */}
              <div className="flex-1 flex flex-col items-center py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(flight.duration_minutes)}</span>
                </div>
                <div className="relative w-full flex items-center justify-center">
                  <div className="h-px bg-border flex-1" />
                  <div className="mx-2 relative">
                    <Plane className="h-4 w-4 text-primary -rotate-90" />
                  </div>
                  <div className="h-px bg-border flex-1" />
                </div>
                <Badge
                  variant={flight.stops === 0 ? "default" : "secondary"}
                  className="mt-1 text-xs"
                >
                  {flight.stops === 0 ? "مباشرة" : `${flight.stops} توقف`}
                </Badge>
              </div>

              {/* Arrival */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-2xl lg:text-3xl font-bold">
                  {formatTime(flight.arrival_time)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {flight.destination?.city_ar}
                </p>
                <p className="text-xs text-muted-foreground">
                  {flight.destination?.airport_code}
                </p>
              </div>
            </div>
          </div>

          {/* Price & Action */}
          <div className="bg-gradient-to-l from-primary/5 to-transparent p-4 lg:p-6 lg:w-48 flex items-center justify-between lg:flex-col lg:justify-center gap-3 border-t lg:border-t-0 lg:border-r">
            <div className="text-center">
              <p className="text-2xl lg:text-3xl font-bold text-primary">
                {formatPrice(flight.price_usd)}
              </p>
              <p className="text-xs text-muted-foreground">للشخص الواحد</p>
            </div>
            {flight.airline?.website_url && (
              <Button asChild size="sm" className="gap-2">
                <a
                  href={flight.airline.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>احجز الآن</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
