import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bus, MapPin, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, Badge, LoadingState, EmptyState, Input } from "@/components/ui";
import type { TransportRoute } from "@/types";

export default function Transport() {
  const [search] = useState("");
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");

  const { data: routes, isLoading } = useQuery<TransportRoute[]>({
    queryKey: ["transport-routes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transport_routes").select("*").order("route_name");
      if (error) throw error;
      return data as TransportRoute[];
    },
  });

  const filtered = routes?.filter((r) => {
    if (!source && !dest) return true;
    const inSource = !source || r.stops.some((s) => s.toLowerCase().includes(source.toLowerCase()));
    const inDest = !dest || r.stops.some((s) => s.toLowerCase().includes(dest.toLowerCase()));
    return inSource && inDest;
  }).filter((r) => !search || r.route_name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Bus className="w-6 h-6 text-navy-700" /> Transport
        </h1>
        <p className="text-sm text-gray-500 mt-1">Plan your route across the city</p>
      </div>

      <Card className="p-5 mb-6">
        <p className="text-xs font-medium text-gray-400 mb-3">ROUTE PLANNER</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <Input
            label="From"
            placeholder="e.g. Sitabuldi"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <Input
            label="To"
            placeholder="e.g. Airport"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-400">Enter source/destination to filter matching routes.</p>
      </Card>

      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-warning-50 text-warning-700 border-warning-200">Demo transport data</Badge>
      </div>

      {isLoading ? (
        <LoadingState message="Loading routes..." />
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<Bus className="w-12 h-12" />} title="No routes found" message="Try different source or destination." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-navy-800">{r.route_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={r.route_type === "METRO" ? "bg-accent-50 text-accent-700 border-accent-200" : "bg-brand-50 text-brand-700 border-brand-200"}>
                      {r.route_type}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~{r.estimated_duration_min} min
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-3">
                {r.stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs text-navy-700">
                      <MapPin className="w-3 h-3 text-gray-400" /> {stop}
                    </span>
                    {i < r.stops.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
