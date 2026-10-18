import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import { MapPin, Filter } from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, LoadingState, Select } from "@/components/ui";
import { NAGPUR_CENTER, categoryLabel, priorityColor, CATEGORIES, STATUSES } from "@/utils/constants";
import type { Complaint } from "@/types";

export default function CityMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: complaints, isLoading } = useQuery<Complaint[]>({
    queryKey: ["map-complaints", statusFilter, categoryFilter],
    queryFn: async () => {
      let q = supabase
        .from("complaints")
        .select("*, department:departments(*)")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("priority_score", { ascending: false });
      if (statusFilter) q = q.eq("status", statusFilter);
      if (categoryFilter) q = q.eq("category", categoryFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Complaint[];
    },
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: NAGPUR_CENTER,
      zoom: 12,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersRef.current || !complaints) return;
    markersRef.current.clearLayers();

    complaints.forEach((c) => {
      if (!c.latitude || !c.longitude) return;

      const color =
        c.priority_score >= 90 ? "#ef4444" :
        c.priority_score >= 70 ? "#f59e0b" :
        c.priority_score >= 40 ? "#3b82f6" : "#9ca3af";

      const icon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] || ch));
      const marker = L.marker([c.latitude, c.longitude], { icon });
      marker.bindPopup(`
        <div style="min-width:180px;">
          <p style="font-weight:600;font-size:13px;margin:0 0 4px;">${esc(c.title)}</p>
          <p style="font-size:11px;color:#6b7280;margin:0 0 6px;">${esc(c.tracking_id)}</p>
          <p style="font-size:12px;margin:0 0 2px;">Category: ${esc(categoryLabel(c.category))}</p>
          <p style="font-size:12px;margin:0 0 2px;">Priority: <span style="font-weight:700;color:${color};">${c.priority_score}</span></p>
          <p style="font-size:12px;margin:0 0 2px;">Status: ${esc(c.status.replace("_", " "))}</p>
          <p style="font-size:12px;margin:0;">Dept: ${esc(c.department?.name || "Unassigned")}</p>
        </div>
      `);
      markersRef.current?.addLayer(marker);
    });
  }, [complaints]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">City Complaint Map</h1>
        <p className="text-sm text-gray-500 mt-1">Live view of civic complaints across your city</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" /> Filter:
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-auto">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden p-0">
            <div ref={mapRef} style={{ height: "500px" }} />
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-navy-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" /> Legend & List
          </h2>
          <Card className="p-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-error-500" /> Critical (90-100)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-warning-500" /> High (70-89)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-brand-500" /> Medium (40-69)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-400" /> Low (0-39)</div>
            </div>
          </Card>

          {isLoading ? (
            <LoadingState />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {complaints?.slice(0, 15).map((c) => (
                <Card key={c.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-800 truncate">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.tracking_id}</p>
                    </div>
                    <p className={`text-lg font-bold ${priorityColor(c.priority_score)}`}>{c.priority_score}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
