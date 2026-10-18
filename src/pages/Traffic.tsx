import { useQuery } from "@tanstack/react-query";
import { Car, AlertTriangle, Clock, MapPin } from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, Badge, LoadingState, EmptyState } from "@/components/ui";
import { severityColor, formatDateShort } from "@/utils/constants";
import type { TrafficIncident } from "@/types";

export default function Traffic() {
  const { data: incidents, isLoading } = useQuery<TrafficIncident[]>({
    queryKey: ["traffic-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("traffic_incidents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrafficIncident[];
    },
  });

  const typeLabels: Record<string, string> = {
    ACCIDENT: "Accident",
    CONGESTION: "Congestion",
    ROAD_WORK: "Road Work",
    CLOSURE: "Road Closure",
    ALERT: "Alert",
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Car className="w-6 h-6 text-warning-600" /> Traffic
        </h1>
        <p className="text-sm text-gray-500 mt-1">Traffic incidents and road alerts across your city</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Badge className="bg-warning-50 text-warning-700 border-warning-200">Demo traffic data</Badge>
      </div>

      {isLoading ? (
        <LoadingState message="Loading traffic data..." />
      ) : !incidents || incidents.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<Car className="w-12 h-12" />} title="No traffic incidents" message="All roads are clear." />
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <Card key={inc.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={severityColor(inc.severity)}>{inc.severity}</Badge>
                    <span className="text-xs text-gray-400">{typeLabels[inc.incident_type] || inc.incident_type}</span>
                  </div>
                  <p className="text-sm font-semibold text-navy-800">{inc.road_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{inc.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateShort(inc.created_at)}</span>
                    {inc.latitude && inc.longitude && (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${inc.latitude}&mlon=${inc.longitude}#map=16/${inc.latitude}/${inc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-brand-600 hover:underline"
                      >
                        <MapPin className="w-3 h-3" /> View location
                      </a>
                    )}
                  </div>
                </div>
                {inc.severity === "CRITICAL" && (
                  <AlertTriangle className="w-6 h-6 text-error-500 flex-shrink-0" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
