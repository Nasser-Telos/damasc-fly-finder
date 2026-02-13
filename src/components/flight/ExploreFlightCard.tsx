import { Plane, Clock, ExternalLink } from "lucide-react";
import type { Flight } from "@/types/flight";
import { formatTime, formatDuration, formatPrice } from "@/lib/formatters";

interface ExploreFlightCardProps {
  flight: Flight;
}

export function ExploreFlightCard({ flight }: ExploreFlightCardProps) {

  return (
    <div className="explore-flight-card">
      {/* Airline */}
      <div className="explore-fc-airline">
        <div className="explore-fc-logo">
          {flight.airline?.code || "—"}
        </div>
        <div className="explore-fc-airline-info">
          <span className="explore-fc-airline-name">{flight.airline?.name_ar}</span>
          <span className="explore-fc-flight-num">{flight.flight_number}</span>
        </div>
      </div>

      {/* Route */}
      <div className="explore-fc-route">
        <div className="explore-fc-point">
          <span className="explore-fc-time">{formatTime(flight.departure_time)}</span>
          <span className="explore-fc-city">{flight.origin?.city_ar}</span>
          <span className="explore-fc-code">{flight.origin?.airport_code}</span>
        </div>

        <div className="explore-fc-middle">
          <div className="explore-fc-duration">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(flight.duration_minutes)}</span>
          </div>
          <div className="explore-fc-line">
            <div className="explore-fc-line-bar" />
            <Plane className="h-3.5 w-3.5 text-primary -rotate-90" />
            <div className="explore-fc-line-bar" />
          </div>
          <span className="explore-fc-stops">
            {flight.stops === 0 ? "مباشرة" : `${flight.stops} توقف`}
          </span>
        </div>

        <div className="explore-fc-point">
          <span className="explore-fc-time">{formatTime(flight.arrival_time)}</span>
          <span className="explore-fc-city">{flight.destination?.city_ar}</span>
          <span className="explore-fc-code">{flight.destination?.airport_code}</span>
        </div>
      </div>

      {/* Price & Action */}
      <div className="explore-fc-bottom">
        <div className="explore-fc-price">
          {formatPrice(flight.price_usd)}
        </div>
        {flight.airline?.website_url && (
          <a
            href={flight.airline.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="explore-fc-book"
          >
            <span>احجز</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
