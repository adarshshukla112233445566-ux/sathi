import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Siren, Phone, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/store/auth";
import { Card, Button, LoadingState, Badge } from "@/components/ui";
import { haversineKm } from "@/utils/constants";
import type { EmergencyService } from "@/types";

export default function SOS() {
  const { session } = useAuth();
  const [recorded, setRecorded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  const { data: services, isLoading } = useQuery<EmergencyService[]>({
    queryKey: ["emergency-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("emergency_services").select("*").order("type");
      if (error) throw error;
      return data as EmergencyService[];
    },
  });

  function getLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  }

  async function handleEmergency(type: "POLICE" | "AMBULANCE" | "FIRE" | "HOSPITAL") {
    setRecording(true);
    const loc = await getLocation();
    if (loc) setUserLoc(loc);

    if (session) {
      await supabase.from("notifications").insert({
        user_id: session.user.id,
        title: `Emergency request recorded: ${type}`,
        message: "Emergency request recorded. Please contact official emergency services for immediate assistance.",
      });
    }
    setRecorded(true);
    setRecording(false);
  }

  const buttons = [
    { type: "POLICE" as const, label: "Police", phone: "100", color: "bg-brand-600", icon: Siren },
    { type: "AMBULANCE" as const, label: "Ambulance", phone: "108", color: "bg-error-600", icon: Siren },
    { type: "FIRE" as const, label: "Fire", phone: "101", color: "bg-warning-600", icon: Siren },
    { type: "HOSPITAL" as const, label: "Nearby Hospital", phone: "", color: "bg-accent-600", icon: Siren },
  ];

  const nearby = services
    ?.filter((s) => s.latitude && s.longitude)
    .map((s) => ({
      ...s,
      distance: userLoc ? haversineKm(userLoc.lat, userLoc.lng, s.latitude!, s.longitude!) : null,
    }))
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999)) || [];

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Siren className="w-6 h-6 text-error-500" /> SOS Emergency
        </h1>
        <p className="text-sm text-gray-500 mt-1">Quick access to emergency services</p>
      </div>

      {recorded && (
        <Card className="p-4 mb-6 bg-success-50 border-success-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-success-700">Emergency request recorded.</p>
              <p className="text-xs text-success-600 mt-0.5">Please contact official emergency services for immediate assistance.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        {buttons.map((btn) => (
          <button
            key={btn.type}
            onClick={() => handleEmergency(btn.type)}
            disabled={recording}
            className="rounded-2xl bg-white border border-gray-100 shadow-card hover:shadow-card-hover p-6 text-center transition group disabled:opacity-50"
          >
            <div className={`w-14 h-14 rounded-2xl ${btn.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition`}>
              <Siren className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-semibold text-navy-800">{btn.label}</p>
            {btn.phone && <p className="text-xs text-gray-400 mt-0.5">Call {btn.phone}</p>}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-xl bg-warning-50 border border-warning-200 p-4">
        <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-warning-700">
          This is a demo. No actual emergency call is placed. Please dial official numbers (100, 108, 101) directly for real emergencies.
        </p>
      </div>

      <h2 className="text-lg font-semibold text-navy-900 mb-3 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-brand-500" /> Nearby Emergency Services
      </h2>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {nearby.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-800">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-gray-50 text-gray-600 border-gray-200">{s.type}</Badge>
                    {s.distance !== null && (
                      <span className="text-xs text-brand-600 font-medium">{s.distance.toFixed(1)} km away</span>
                    )}
                  </div>
                </div>
                <a href={`tel:${s.phone}`}>
                  <Button variant="outline" size="sm">
                    <Phone className="w-3.5 h-3.5" /> {s.phone}
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
