import { Plane, TrendingUp, Shield, Clock } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { FlightSearchForm } from "@/components/flight/FlightSearchForm";
import { DestinationCard } from "@/components/flight/DestinationCard";
import { AirlineCard } from "@/components/flight/AirlineCard";
import { useDestinations, useAirlines } from "@/hooks/useFlights";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: destinations, isLoading: destinationsLoading } = useDestinations();
  const { data: airlines, isLoading: airlinesLoading } = useAirlines();

  const otherDestinations = destinations?.filter(d => d.airport_code !== 'DAM') || [];
  const featuredAirlines = airlines?.slice(0, 6) || [];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-dark via-primary to-primary/80 text-white">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-medium rounded-full blur-3xl" />
        </div>
        
        {/* Animated Plane */}
        <div className="absolute top-1/2 -translate-y-1/2 opacity-20 animate-plane-fly">
          <Plane className="h-16 w-16" />
        </div>

        <div className="container relative py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              ابحث عن رحلتك
              <span className="block text-gold">من وإلى دمشق</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              قارن أسعار الرحلات من جميع شركات الطيران العاملة واحجز رحلتك بأفضل الأسعار
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-muted/50">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-6 bg-card rounded-xl shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">مقارنة الأسعار</h3>
                <p className="text-sm text-muted-foreground">قارن بين جميع الشركات</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-card rounded-xl shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">معلومات موثوقة</h3>
                <p className="text-sm text-muted-foreground">بيانات محدثة باستمرار</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-card rounded-xl shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">بحث سريع</h3>
                <p className="text-sm text-muted-foreground">نتائج فورية</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">الوجهات المتاحة</h2>
              <p className="text-muted-foreground">اكتشف جميع الوجهات من وإلى دمشق</p>
            </div>
          </div>

          {destinationsLoading ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherDestinations.slice(0, 8).map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  type="to"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Airlines Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">شركات الطيران</h2>
              <p className="text-muted-foreground">الشركات العاملة من وإلى دمشق</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/airlines">عرض الكل</Link>
            </Button>
          </div>

          {airlinesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAirlines.map((airline) => (
                <AirlineCard key={airline.id} airline={airline} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
