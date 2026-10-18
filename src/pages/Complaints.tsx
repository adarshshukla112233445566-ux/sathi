import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PlusCircle, ClipboardList, Filter } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/services/supabase";
import { Card, Badge, LoadingState, EmptyState, Select } from "@/components/ui";
import {
  categoryLabel,
  severityColor,
  statusColor,
  priorityColor,
  formatDateShort,
  CATEGORIES,
  STATUSES,
} from "@/utils/constants";
import type { Complaint } from "@/types";
import { ComplaintImage } from "@/components/ComplaintImage";

export default function Complaints() {
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data, isLoading } = useQuery<Complaint[]>({
    queryKey: ["my-complaints", statusFilter, categoryFilter],
    queryFn: async () => {
      let q = supabase
        .from("complaints")
        .select("*, department:departments(*)")
        .order("created_at", { ascending: false });
      if (statusFilter) q = q.eq("status", statusFilter);
      if (categoryFilter) q = q.eq("category", categoryFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Complaint[];
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">My Complaints</h1>
          <p className="text-sm text-gray-500 mt-1">Track all your civic reports</p>
        </div>
        <Link
          to="/report"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-brand-700 transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> New Report
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" /> Filter:
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-auto">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading complaints..." />
      ) : !data || data.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<ClipboardList className="w-12 h-12" />}
            title="No complaints found"
            message="Report a civic problem to see it tracked here."
            action={
              <Link to="/report" className="text-sm text-brand-600 font-medium hover:underline">
                Report a problem →
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.map((c) => (
            <Card key={c.id} to={`/complaints/${c.id}`} className="p-4">
              <ComplaintImage path={c.image_url} alt={c.title} className="w-full h-32 object-cover rounded-xl mb-3" placeholderClassName="h-32 rounded-xl mb-3" />
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono text-gray-400">{c.tracking_id}</span>
                <Badge className={statusColor(c.status)}>{c.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-sm font-semibold text-navy-800 mb-1">{c.title}</p>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-50 text-gray-600 border-gray-200">{categoryLabel(c.category)}</Badge>
                  <Badge className={severityColor(c.severity)}>{c.severity}</Badge>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${priorityColor(c.priority_score)}`}>{c.priority_score}</p>
                  <p className="text-[10px] text-gray-400">{formatDateShort(c.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
