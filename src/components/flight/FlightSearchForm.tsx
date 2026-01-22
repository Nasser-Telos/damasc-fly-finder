import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, ArrowRightLeft, Calendar, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useDestinations } from "@/hooks/useFlights";
import type { FlightSearchParams } from "@/types/flight";

export function FlightSearchForm() {
  const navigate = useNavigate();
  const { data: destinations } = useDestinations();
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    tripType: "to_damascus",
    passengers: 1,
  });
  const [date, setDate] = useState<Date>();

  const otherDestinations = destinations?.filter(d => d.airport_code !== 'DAM') || [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("type", searchParams.tripType);
    if (searchParams.destination) {
      params.set("destination", searchParams.destination);
    }
    if (date) {
      params.set("date", date.toISOString());
    }
    params.set("passengers", searchParams.passengers.toString());
    
    navigate(`/search?${params.toString()}`);
  };

  return (
    <Card className="glass-effect shadow-flight border-0">
      <CardContent className="p-6 md:p-8">
        <div className="grid gap-6">
          {/* Trip Type Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant={searchParams.tripType === "to_damascus" ? "default" : "outline"}
              className="flex-1 sm:flex-initial gap-2"
              onClick={() => setSearchParams(prev => ({ ...prev, tripType: "to_damascus" }))}
            >
              <Plane className="h-4 w-4 rotate-90" />
              رحلات إلى دمشق
            </Button>
            <Button
              variant={searchParams.tripType === "from_damascus" ? "default" : "outline"}
              className="flex-1 sm:flex-initial gap-2"
              onClick={() => setSearchParams(prev => ({ ...prev, tripType: "from_damascus" }))}
            >
              <Plane className="h-4 w-4 -rotate-90" />
              رحلات من دمشق
            </Button>
          </div>

          {/* Search Fields */}
          <div className="grid md:grid-cols-4 gap-4">
            {/* Destination Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {searchParams.tripType === "to_damascus" ? "المغادرة من" : "الوجهة"}
              </label>
              <Select
                value={searchParams.destination}
                onValueChange={(value) =>
                  setSearchParams(prev => ({ ...prev, destination: value }))
                }
              >
                <SelectTrigger className="h-12 bg-background">
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدن</SelectItem>
                  {otherDestinations.map((dest) => (
                    <SelectItem key={dest.id} value={dest.airport_code}>
                      <span className="flex items-center gap-2">
                        {dest.city_ar} ({dest.airport_code})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Damascus (Fixed) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {searchParams.tripType === "to_damascus" ? "الوصول إلى" : "المغادرة من"}
              </label>
              <div className="h-12 px-3 flex items-center bg-muted rounded-lg border">
                <span className="font-medium">دمشق (DAM)</span>
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                تاريخ السفر
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-start text-right bg-background"
                  >
                    <Calendar className="ml-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ar }) : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                عدد المسافرين
              </label>
              <Select
                value={searchParams.passengers.toString()}
                onValueChange={(value) =>
                  setSearchParams(prev => ({ ...prev, passengers: parseInt(value) }))
                }
              >
                <SelectTrigger className="h-12 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {num} {num === 1 ? "مسافر" : "مسافرين"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button
            size="lg"
            className="w-full md:w-auto md:px-12 mx-auto h-14 text-lg gap-3"
            onClick={handleSearch}
          >
            <Search className="h-5 w-5" />
            ابحث عن الرحلات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
