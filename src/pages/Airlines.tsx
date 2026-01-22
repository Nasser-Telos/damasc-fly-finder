import { Layout } from "@/components/layout/Layout";
import { AirlineCard } from "@/components/flight/AirlineCard";
import { useAirlines } from "@/hooks/useFlights";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane } from "lucide-react";

export default function AirlinesPage() {
  const { data: airlines, isLoading } = useAirlines();

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-br from-navy-dark to-primary text-white py-16">
        <div className="container text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-6">
            <Plane className="h-8 w-8 text-navy-dark" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">شركات الطيران</h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            تعرف على جميع شركات الطيران العاملة من وإلى دمشق، مع روابط مباشرة لمواقعها الرسمية
          </p>
        </div>
      </section>

      {/* Airlines Grid */}
      <section className="py-12">
        <div className="container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Syrian Airlines */}
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded" />
                  شركات الطيران السورية
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {airlines
                    ?.filter(a => a.country === "Syria")
                    .map((airline) => (
                      <AirlineCard key={airline.id} airline={airline} />
                    ))}
                </div>
              </div>

              {/* International Airlines */}
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gold rounded" />
                  شركات الطيران الدولية
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {airlines
                    ?.filter(a => a.country !== "Syria")
                    .map((airline) => (
                      <AirlineCard key={airline.id} airline={airline} />
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
