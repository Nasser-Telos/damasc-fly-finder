import { ExternalLink, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Airline } from "@/types/flight";

interface AirlineCardProps {
  airline: Airline;
}

export function AirlineCard({ airline }: AirlineCardProps) {
  return (
    <Card className="hover:shadow-flight transition-all duration-300 group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            {airline.logo_url ? (
              <img
                src={airline.logo_url}
                alt={airline.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {airline.code}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
              {airline.name_ar}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {airline.name}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {airline.description_ar}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            كود: <span className="font-mono font-bold">{airline.code}</span>
          </span>
          {airline.website_url && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a
                href={airline.website_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>زيارة الموقع</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
