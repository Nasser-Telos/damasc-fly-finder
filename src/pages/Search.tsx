import { useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { Filter, SortAsc, Plane, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { FlightCard } from "@/components/flight/FlightCard";
import { FlightSearchForm } from "@/components/flight/FlightSearchForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDamascusFlights, useAirlines } from "@/hooks/useFlights";
import type { FlightFilters } from "@/types/flight";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const tripType = searchParams.get("type") as "from_damascus" | "to_damascus" || "to_damascus";
  const destinationCode = searchParams.get("destination") || undefined;

  const type = tripType === "from_damascus" ? "from" : "to";
  const { data: flights, isLoading } = useDamascusFlights(type, destinationCode === "all" ? undefined : destinationCode);
  const { data: airlines } = useAirlines();

  const [filters, setFilters] = useState<FlightFilters>({
    airlines: [],
    maxPrice: null,
    directOnly: false,
    sortBy: "price",
  });

  // Filter and sort flights
  const filteredFlights = useMemo(() => {
    if (!flights) return [];

    let result = [...flights];

    // Filter by airlines
    if (filters.airlines.length > 0) {
      result = result.filter(f => f.airline && filters.airlines.includes(f.airline.code));
    }

    // Filter direct only
    if (filters.directOnly) {
      result = result.filter(f => f.stops === 0);
    }

    // Filter by max price
    if (filters.maxPrice) {
      result = result.filter(f => f.price_usd && f.price_usd <= filters.maxPrice!);
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "price":
          return (a.price_usd || 9999) - (b.price_usd || 9999);
        case "duration":
          return a.duration_minutes - b.duration_minutes;
        case "departure":
          return a.departure_time.localeCompare(b.departure_time);
        default:
          return 0;
      }
    });

    return result;
  }, [flights, filters]);

  const toggleAirlineFilter = (code: string) => {
    setFilters(prev => ({
      ...prev,
      airlines: prev.airlines.includes(code)
        ? prev.airlines.filter(c => c !== code)
        : [...prev.airlines, code],
    }));
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <Label className="text-sm font-medium mb-2 block">ترتيب حسب</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value: "price" | "duration" | "departure") =>
            setFilters(prev => ({ ...prev, sortBy: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">السعر (الأقل أولاً)</SelectItem>
            <SelectItem value="duration">المدة (الأقصر أولاً)</SelectItem>
            <SelectItem value="departure">وقت المغادرة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Direct Only */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="directOnly"
          checked={filters.directOnly}
          onCheckedChange={(checked) =>
            setFilters(prev => ({ ...prev, directOnly: !!checked }))
          }
        />
        <Label htmlFor="directOnly" className="cursor-pointer">
          رحلات مباشرة فقط
        </Label>
      </div>

      {/* Airlines Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">شركات الطيران</Label>
        <div className="space-y-2">
          {airlines?.map((airline) => (
            <div key={airline.id} className="flex items-center gap-3">
              <Checkbox
                id={`airline-${airline.code}`}
                checked={filters.airlines.includes(airline.code)}
                onCheckedChange={() => toggleAirlineFilter(airline.code)}
              />
              <Label
                htmlFor={`airline-${airline.code}`}
                className="cursor-pointer text-sm"
              >
                {airline.name_ar}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() =>
          setFilters({
            airlines: [],
            maxPrice: null,
            directOnly: false,
            sortBy: "price",
          })
        }
      >
        مسح الفلاتر
      </Button>
    </div>
  );

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-br from-navy-dark to-primary py-8">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    الفلاتر
                  </h3>
                  <FiltersContent />
                </CardContent>
              </Card>
            </aside>

            {/* Results List */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    {tripType === "to_damascus" ? "رحلات إلى دمشق" : "رحلات من دمشق"}
                  </h1>
                  <p className="text-muted-foreground">
                    {isLoading ? "جاري البحث..." : `${filteredFlights.length} رحلة متاحة`}
                  </p>
                </div>

                {/* Mobile Filters */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden gap-2">
                      <Filter className="h-4 w-4" />
                      الفلاتر
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader>
                      <SheetTitle>الفلاتر</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FiltersContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">جاري البحث عن الرحلات...</p>
                </div>
              ) : filteredFlights.length === 0 ? (
                <Card>
                  <CardContent className="py-20 text-center">
                    <Plane className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">لا توجد رحلات</h3>
                    <p className="text-muted-foreground">
                      جرب تغيير معايير البحث أو اختر وجهة مختلفة
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredFlights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
