import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, LoadingState, Badge } from "@/components/ui";
import { statusColor, severityColor, CATEGORIES, STATUSES } from "@/utils/constants";
import type { Complaint, Severity } from "@/types";

interface DailyCount {
  date: string;
  count: number;
}

export default function AdminAnalytics() {
  const { data: complaints, isLoading } = useQuery<Complaint[]>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, department:departments(*)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Complaint[];
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingState message="Loading analytics..." />;

  const all = complaints || [];
  const total = all.length;

  const byCategory: Record<string, number> = {};
  CATEGORIES.forEach((c) => (byCategory[c.value] = 0));
  all.forEach((c) => {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  });

  const byStatus: Record<string, number> = {};
  STATUSES.forEach((s) => (byStatus[s] = 0));
  all.forEach((c) => {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  });

  const bySeverity: Record<string, number> = {};
  all.forEach((c) => {
    bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1;
  });

  const byCity: Record<string, number> = {};
  all.forEach((c) => {
    const city = c.city || "Unknown";
    byCity[city] = (byCity[city] || 0) + 1;
  });

  const resolvedCount = byStatus["RESOLVED"] || 0;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const criticalCount = bySeverity["CRITICAL"] || 0;
  const pendingCount = (byStatus["SUBMITTED"] || 0) + (byStatus["UNDER_REVIEW"] || 0) + (byStatus["ASSIGNED"] || 0);
  const inProgressCount = byStatus["IN_PROGRESS"] || 0;

  const resolvedComplaints = all.filter((c) => c.status === "RESOLVED");
  const avgResolutionDays = resolvedComplaints.length > 0
    ? Math.round(
        (resolvedComplaints.reduce((sum, c) => {
          const created = new Date(c.created_at).getTime();
          const updated = new Date(c.updated_at).getTime();
          return sum + (updated - created) / (1000 * 60 * 60 * 24);
        }, 0) / resolvedComplaints.length) * 10
      ) / 10
    : 0;

  const last14Days: DailyCount[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = all.filter((c) => c.created_at.startsWith(dateStr)).length;
    last14Days.push({ date: dateStr, count });
  }
  const maxDaily = Math.max(...last14Days.map((d) => d.count), 1);

  const maxCategory = Math.max(...Object.values(byCategory), 1);
  const maxStatus = Math.max(...Object.values(byStatus), 1);

  const cities = Object.entries(byCity).sort((a, b) => b[1] - a[1]);
  const maxCity = Math.max(...cities.map(([, v]) => v), 1);

  const summaryCards = [
    { label: "Total Complaints", value: total, icon: BarChart3, color: "text-navy-700", bg: "bg-navy-50" },
    { label: "Resolution Rate", value: `${resolutionRate}%`, icon: CheckCircle2, color: "text-success-600", bg: "bg-success-50" },
    { label: "Critical Issues", value: criticalCount, icon: AlertTriangle, color: "text-error-600", bg: "bg-error-50" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-warning-600", bg: "bg-warning-50" },
    { label: "In Progress", value: inProgressCount, icon: TrendingUp, color: "text-brand-600", bg: "bg-brand-50" },
    { label: "Avg Resolution", value: `${avgResolutionDays}d`, icon: Activity, color: "text-accent-600", bg: "bg-accent-50" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-500" /> Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">Complaint insights and trends across the city</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {summaryCards.map((m) => (
          <Card key={m.label} className="p-4">
            <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-2`}>
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
            <p className="text-2xl font-bold text-navy-900">{m.value}</p>
            <p className="text-xs text-gray-500">{m.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Daily trend */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-navy-800 mb-4">Daily Complaint Trend (Last 14 Days)</h3>
          <div className="flex items-end gap-2 h-48">
            {last14Days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="text-[10px] text-gray-400 font-medium">{d.count}</div>
                <div
                  className="w-full rounded-t-md bg-brand-200 hover:bg-brand-300 transition-all"
                  style={{ height: `${(d.count / maxDaily) * 140}px`, minHeight: d.count > 0 ? "4px" : "0" }}
                  title={`${d.date}: ${d.count} complaints`}
                />
                <div className="text-[9px] text-gray-400">
                  {d.date.split("-").slice(1).join("/")}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* By Category */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-4">Complaints by Category</h3>
          <div className="space-y-2.5">
            {CATEGORIES.map((cat) => {
              const count = byCategory[cat.value] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat.value}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-navy-700 font-medium">{cat.label}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${(count / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* By Status */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-4">Complaints by Status</h3>
          <div className="space-y-2.5">
            {STATUSES.map((status) => {
              const count = byStatus[status] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColor(status)}>{status.replace("_", " ")}</Badge>
                    </div>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-navy-400 transition-all"
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* By Severity */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-4">Complaints by Severity</h3>
          <div className="space-y-2.5">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((sev) => {
              const count = bySeverity[sev] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={sev}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <Badge className={severityColor(sev)}>{sev}</Badge>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        sev === "CRITICAL" ? "bg-error-500"
                        : sev === "HIGH" ? "bg-warning-500"
                        : sev === "MEDIUM" ? "bg-brand-500"
                        : "bg-gray-400"
                      }`}
                      style={{ width: `${(count / Math.max(...Object.values(bySeverity), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* By City */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-4">Complaints by City</h3>
          {cities.length === 0 ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            <div className="space-y-2.5">
              {cities.map(([city, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={city}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-navy-700 font-medium">{city}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-500 transition-all"
                        style={{ width: `${(count / maxCity) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
