import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  PlusCircle,
  Siren,
  Hospital,
  Bus,
  Car,
  MapPin,
  Sparkles,
  ClipboardList,
  Bell,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/store/auth";
import { Card, Badge, LoadingState, EmptyState } from "@/components/ui";
import {
  categoryLabel,
  severityColor,
  statusColor,
  priorityColor,
  formatDateShort,
} from "@/utils/constants";
import type { Complaint, Notification } from "@/types";

export default function Dashboard() {
  const { profile } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const { data: complaints, isLoading: complaintsLoading } = useQuery<Complaint[]>({
    queryKey: ["my-complaints-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, department:departments(*)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as unknown as Complaint[];
    },
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["my-notifications-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data as Notification[];
    },
  });

  const quickActions = [
    { to: "/report", label: "Report Problem", icon: PlusCircle, color: "bg-brand-600" },
    { to: "/sos", label: "SOS", icon: Siren, color: "bg-error-600" },
    { to: "/hospitals", label: "Hospitals", icon: Hospital, color: "bg-accent-600" },
    { to: "/transport", label: "Transport", icon: Bus, color: "bg-navy-700" },
    { to: "/traffic", label: "Traffic", icon: Car, color: "bg-warning-600" },
    { to: "/explore", label: "Explore India", icon: MapPin, color: "bg-success-600" },
  ];

  const activeComplaints = complaints?.filter((c) => c.status !== "RESOLVED") || [];

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">
          Welcome, {profile?.name?.split(" ")[0] || "Citizen"}
        </h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-brand-500" />
          {location
            ? `Your location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
            : "Locating..."}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white border border-gray-100 p-3 md:p-4 shadow-card hover:shadow-card-hover transition group"
          >
            <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-navy-700 text-center leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* AI Assistant banner */}
      <Link
        to="/ai-assistant"
        className="block mb-6 rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 p-5 shadow-card hover:shadow-card-hover transition group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Saathi AI Assistant</h3>
            <p className="text-sm text-navy-300">Ask about roads, garbage, streetlights, hospitals, traffic...</p>
          </div>
          <span className="text-brand-400 text-sm font-medium group-hover:translate-x-1 transition">Ask now →</span>
        </div>
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active complaints */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand-500" />
              Active Complaints
            </h2>
            <Link to="/complaints" className="text-sm text-brand-600 font-medium hover:underline">
              View all
            </Link>
          </div>

          {complaintsLoading ? (
            <Card className="p-6"><LoadingState /></Card>
          ) : activeComplaints.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={<ClipboardList className="w-12 h-12" />}
                title="No active complaints"
                message="Report a civic problem and track its progress here."
                action={
                  <Link to="/report" className="text-sm text-brand-600 font-medium hover:underline">
                    Report a problem →
                  </Link>
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {activeComplaints.map((c) => (
                <Card key={c.id} to={`/complaints/${c.id}`} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">{c.tracking_id}</span>
                        <Badge className={statusColor(c.status)}>{c.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm font-medium text-navy-800 truncate">{c.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {categoryLabel(c.category)} · {c.department?.name || "Unassigned"} · {formatDateShort(c.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-2xl font-bold ${priorityColor(c.priority_score)}`}>{c.priority_score}</p>
                      <Badge className={severityColor(c.severity)}>{c.severity}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Notifications + stats */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-brand-500" />
              Notifications
            </h2>
            <Card className="divide-y divide-gray-50">
              {notifications && notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className="p-4">
                    <p className="text-sm font-medium text-navy-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{formatDateShort(n.created_at)}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">No notifications yet</div>
              )}
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              Your Impact
            </h2>
            <Card className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-bold text-navy-900">{complaints?.length || 0}</p>
                  <p className="text-xs text-gray-500">Total Reports</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-success-600">
                    {complaints?.filter((c) => c.status === "RESOLVED").length || 0}
                  </p>
                  <p className="text-xs text-gray-500">Resolved</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
