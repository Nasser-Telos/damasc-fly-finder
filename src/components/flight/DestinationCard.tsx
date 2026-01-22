import { MapPin, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import type { Destination } from "@/types/flight";

interface DestinationCardProps {
  destination: Destination;
  type: "from" | "to";
}

export function DestinationCard({ destination, type }: DestinationCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const searchType = type === "from" ? "from_damascus" : "to_damascus";
    navigate(`/search?type=${searchType}&destination=${destination.airport_code}`);
  };

  return (
    <Card
      className="hover:shadow-flight transition-all duration-300 cursor-pointer group overflow-hidden"
      onClick={handleClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
              {destination.city_ar}
            </h3>
            <p className="text-sm text-muted-foreground">
              {destination.country_ar}
            </p>
          </div>
          <div className="text-left">
            <span className="font-mono text-lg font-bold text-primary">
              {destination.airport_code}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
