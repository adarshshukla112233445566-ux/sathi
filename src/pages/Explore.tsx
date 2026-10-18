import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Navigation, Search, LocateFixed } from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, Badge, LoadingState, EmptyState } from "@/components/ui";
import { haversineKm } from "@/utils/constants";
import type { TouristLocation } from "@/types";

const EXPLORE_FALLBACK = "https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "PARKS", label: "Parks" },
  { value: "HERITAGE", label: "Heritage" },
  { value: "LAKES", label: "Lakes" },
  { value: "TEMPLES", label: "Temples" },
  { value: "TOURIST_ATTRACTIONS", label: "Tourist Attractions" },
  { value: "FORTS", label: "Forts" },
  { value: "NATURE", label: "Nature" },
];

const FALLBACK_IMAGES: Record<string, string> = {
  "Taj Mahal": "https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "India Gate": "https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Gateway of India": "https://images.pexels.com/photos/36874536/pexels-photo-36874536.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Hawa Mahal": "https://images.pexels.com/photos/784885/pexels-photo-784885.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Charminar": "https://images.pexels.com/photos/11321242/pexels-photo-11321242.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Marine Drive": "https://images.pexels.com/photos/35709783/pexels-photo-35709783.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Ellora Caves": "https://images.pexels.com/photos/31912392/pexels-photo-31912392.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Sanchi Stupa": "https://images.pexels.com/photos/36588603/pexels-photo-36588603.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Red Fort": "https://images.pexels.com/photos/14094276/pexels-photo-14094276.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Qutub Minar": "https://images.pexels.com/photos/16892575/pexels-photo-16892575.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Mysore Palace": "https://images.pexels.com/photos/9882016/pexels-photo-9882016.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Amer Fort": "https://images.pexels.com/photos/19446861/pexels-photo-19446861.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Lotus Temple": "https://images.pexels.com/photos/4727066/pexels-photo-4727066.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Golden Temple": "https://images.pexels.com/photos/18275890/pexels-photo-18275890.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Konark Sun Temple": "https://images.pexels.com/photos/6040175/pexels-photo-6040175.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Meenakshi Temple": "https://images.pexels.com/photos/33895627/pexels-photo-33895627.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Dal Lake": "https://images.pexels.com/photos/18758350/pexels-photo-18758350.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Lake Pichola": "https://images.pexels.com/photos/33658452/pexels-photo-33658452.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Lodhi Garden": "https://images.pexels.com/photos/12446146/pexels-photo-12446146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Cubbon Park": "https://images.pexels.com/photos/4070763/pexels-photo-4070763.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Varanasi Ghats": "https://images.pexels.com/photos/17869831/pexels-photo-17869831.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Kerala Backwaters": "https://images.pexels.com/photos/36998153/pexels-photo-36998153.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Valley of Flowers": "https://images.pexels.com/photos/32108616/pexels-photo-32108616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Ambazari Lake": "https://images.pexels.com/photos/35933420/pexels-photo-35933420.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Tekdi Ganesh Temple": "https://images.pexels.com/photos/30722659/pexels-photo-30722659.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Deekshabhoomi": "https://images.pexels.com/photos/40241088/pexels-photo-40241088.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Gandhi Sagar Lake": "https://images.pexels.com/photos/9304308/pexels-photo-9304308.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Maharajbagh Zoo": "https://images.pexels.com/photos/29586035/pexels-photo-29586035.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Sitabuldi Fort": "https://images.pexels.com/photos/30639519/pexels-photo-30639519.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Japanese Garden": "https://images.pexels.com/photos/31981248/pexels-photo-31981248.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Futala Lake": "https://images.pexels.com/photos/13137210/pexels-photo-13137210.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Ramtek Temple": "https://images.pexels.com/photos/11370871/pexels-photo-11370871.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "Nagzira Wildlife Sanctuary": "https://images.pexels.com/photos/12601505/pexels-photo-12601505.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

function imageForLocation(name: string, dbImage: string | null): string {
  return dbImage || FALLBACK_IMAGES[name] || EXPLORE_FALLBACK;
}

function DestinationImage({ name, src }: { name: string; src: string }) {
  const [imageSrc, setImageSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setFailed(false);
  }, [src]);

  if (failed) {
    return <div className="flex h-full w-full items-center justify-center bg-navy-100 text-sm font-medium text-navy-500">Photo unavailable</div>;
  }

  return <img src={imageSrc} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" onError={() => {
    if (imageSrc !== EXPLORE_FALLBACK) setImageSrc(EXPLORE_FALLBACK);
    else setFailed(true);
  }} />;
}

export default function Explore() {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  function captureLocation() {
    setLocating(true);
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported on this device");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocError("Could not access your location"); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const { data: locations, isLoading } = useQuery<TouristLocation[]>({
    queryKey: ["tourist-locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tourist_locations").select("*").order("name");
      if (error) throw error;
      return data as TouristLocation[];
    },
  });

  const filtered = locations
    ?.filter((l) => !category || l.category === category)
    .filter((l) => !search || l.name.toLowerCase().includes(search.toLowerCase()))
    .map((l) => ({
      ...l,
      distance: userLoc ? haversineKm(userLoc.lat, userLoc.lng, l.latitude, l.longitude) : null,
    }))
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999)) || [];

  return (
    <div className="animate-fade-in">
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-navy-950 shadow-card">
        <img src="https://images.pexels.com/photos/33054187/pexels-photo-33054187.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Serene Indian lake with mountains" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/75 to-transparent" />
        <div className="relative min-h-[220px] p-6 sm:p-8 flex items-end">
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-saffron-300">Discover the beauty of India</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 sm:text-4xl">
              <MapPin className="h-7 w-7 text-success-300" /> Explore India
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/80">Find lakes, parks, temples, forts, heritage sites and natural wonders with photos, distances and directions.</p>
          </div>
        </div>
      </div>

      {/* GPS location bar */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-card">
        <LocateFixed className="w-4 h-4 text-brand-500" />
        {userLoc ? (
          <p className="text-sm text-navy-700 font-medium">Your location: {userLoc.lat.toFixed(4)}, {userLoc.lng.toFixed(4)}</p>
        ) : locating ? (
          <p className="text-sm text-gray-500">Detecting location...</p>
        ) : (
          <p className="text-sm text-gray-500">Location not detected</p>
        )}
        <button onClick={captureLocation} disabled={locating} className="ml-auto text-sm text-brand-600 font-medium hover:underline disabled:opacity-50">
          {locating ? "Locating..." : "Use my location"}
        </button>
      </div>
      {locError && <p className="text-xs text-error-600 mb-3">{locError}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              category === c.value ? "bg-brand-600 text-white border-brand-600" : "bg-white border-gray-200 text-navy-700 hover:bg-gray-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search places..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition"
        />
      </div>

      {isLoading ? (
        <LoadingState message="Loading places..." />
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<MapPin className="w-12 h-12" />} title="No places found" message="Try a different category or search." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((loc) => (
            <Card key={loc.id} className="overflow-hidden p-0 hover:shadow-card-hover transition group">
              <div className="relative h-44 overflow-hidden">
                <DestinationImage name={loc.name} src={imageForLocation(loc.name, loc.image_url)} />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/90 text-navy-800 border-white/50 shadow-sm backdrop-blur-sm">{loc.category.replace("_", " ")}</Badge>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-navy-900">{loc.name}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{loc.description}</p>
                <div className="flex items-center justify-between mt-3">
                  {loc.distance !== null ? (
                    <p className="text-xs text-brand-600 font-medium">{loc.distance.toFixed(1)} km away</p>
                  ) : (
                    <p className="text-xs text-gray-400">Distance unknown</p>
                  )}
                  <a
                    href={`https://www.openstreetmap.org/directions?from=${userLoc ? `${userLoc.lat},${userLoc.lng}` : ""}&to=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Directions
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
