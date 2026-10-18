import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Phone, Navigation, Hospital as HospitalIcon } from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, Badge, LoadingState, EmptyState } from "@/components/ui";
import { haversineKm } from "@/utils/constants";
import type { Hospital } from "@/types";

export default function Hospitals() {
  const [search, setSearch] = useState("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const { data: hospitals, isLoading } = useQuery<Hospital[]>({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hospitals").select("*").order("name");
      if (error) throw error;
      return data as Hospital[];
    },
  });

  const filtered = hospitals
    ?.filter((h) => !emergencyOnly || h.emergency_available)
    .filter((h) => !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.address.toLowerCase().includes(search.toLowerCase()))
    .map((h) => ({
      ...h,
      distance: userLoc ? haversineKm(userLoc.lat, userLoc.lng, h.latitude, h.longitude) : null,
    }))
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999)) || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <HospitalIcon className="w-6 h-6 text-accent-600" /> Hospitals
        </h1>
        <p className="text-sm text-gray-500 mt-1">Find nearby hospitals and emergency care</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search hospitals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition"
          />
        </div>
        <button
          onClick={() => setEmergencyOnly(!emergencyOnly)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            emergencyOnly ? "bg-error-50 border-error-200 text-error-700" : "bg-white border-gray-200 text-navy-700"
          }`}
        >
          Emergency Only
        </button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading hospitals..." />
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<HospitalIcon className="w-12 h-12" />} title="No hospitals found" message="Try adjusting your search." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((h) => (
            <Card key={h.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-navy-800">{h.name}</p>
                  {h.distance !== null && (
                    <p className="text-xs text-brand-600 font-medium mt-0.5">{h.distance.toFixed(1)} km away</p>
                  )}
                </div>
                {h.emergency_available && (
                  <Badge className="bg-error-50 text-error-700 border-error-200">24/7 Emergency</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {h.address}
              </p>
              <div className="flex items-center gap-2">
                <a href={`tel:${h.phone}`}>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-gray-50 transition">
                    <Phone className="w-3.5 h-3.5" /> {h.phone}
                  </span>
                </a>
                <a
                  href={`https://www.openstreetmap.org/directions?from=${userLoc ? `${userLoc.lat},${userLoc.lng}` : ""}&to=${h.latitude},${h.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition"
                >
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
