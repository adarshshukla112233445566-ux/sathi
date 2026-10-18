import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, LoadingState, Badge } from "@/components/ui";
import { categoryLabel, statusColor, priorityColor, formatDateShort } from "@/utils/constants";
import type { Complaint } from "@/types";

export default function AdminDashboard() {
  const { data: complaints, isLoading } = useQuery<Complaint[]>({
    queryKey: ["admin-all-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, department:departments(*)")
        .order("priority_score", { ascending: false });
      if (error) throw error;
      return data as unknown as Complaint[];
    },
    refetchInterval: 30000,
  });

  const total = complaints?.length || 0;
  const critical = complaints?.filter((c) => c.severity === "CRITICAL").length || 0;
  const pending = complaints?.filter((c) => c.status === "SUBMITTED" || c.status === "UNDER_REVIEW").length || 0;
  const inProgress = complaints?.filter((c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED").length || 0;
  const resolved = complaints?.filter((c) => c.status === "RESOLVED").length || 0;

  const resolvedComplaints = complaints?.filter((c) => c.status === "RESOLVED") || [];
  const avgResolution = resolvedComplaints.length > 0
    ? Math.round(
        resolvedComplaints.reduce((sum, c) => {
          const created = new Date(c.created_at).getTime();
          const updated = new Date(c.updated_at).getTime();
          return sum + (updated - created) / (1000 * 60 * 60 * 24);
        }, 0) / resolvedComplaints.length
      )
    : 0;

  const metrics = [
    { label: "Total Complaints", value: total, icon: ClipboardList, color: "text-navy-700", bg: "bg-navy-50" },
    { label: "Critical Issues", value: critical, icon: AlertTriangle, color: "text-error-600", bg: "bg-error-50" },
    { label: "Pending", value: pending, icon: Clock, color: "text-warning-600", bg: "bg-warning-50" },
    { label: "In Progress", value: inProgress, icon: TrendingUp, color: "text-brand-600", bg: "bg-brand-50" },
    { label: "Resolved", value: resolved, icon: CheckCircle2, color: "text-success-600", bg: "bg-success-50" },
    { label: "Avg Resolution", value: `${avgResolution}d`, icon: Clock, color: "text-accent-600", bg: "bg-accent-50" },
  ];

  const recent = complaints?.slice(0, 6) || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">City-wide complaint management overview</p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading dashboard..." />
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {metrics.map((m) => (
              <Card key={m.label} className="p-4">
                <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-2`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <p className="text-2xl font-bold text-navy-900">{m.value}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </Card>
            ))}
          </div>

          {/* Recent complaints */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-navy-900">Recent Complaints</h2>
            <Link to="/admin/complaints" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
              Manage all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="divide-y divide-gray-50">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No complaints yet</div>
            ) : (
              recent.map((c) => (
                <Link
                  key={c.id}
                  to={`/admin/complaints/${c.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-400">{c.tracking_id}</span>
                      <Badge className={statusColor(c.status)}>{c.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-sm font-medium text-navy-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">{categoryLabel(c.category)} · {c.department?.name || "Unassigned"} · {formatDateShort(c.created_at)}</p>
                  </div>
                  <p className={`text-xl font-bold ${priorityColor(c.priority_score)} ml-3`}>{c.priority_score}</p>
                </Link>
              ))
            )}
          </Card>
        </>
      )}
    </div>
  );
}
