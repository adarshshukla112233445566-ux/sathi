import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Shield, ArrowRight, AlertTriangle } from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, LoadingState, EmptyState, Badge } from "@/components/ui";
import { categoryLabel, severityColor, priorityColor } from "@/utils/constants";
import type { Complaint } from "@/types";
import { ComplaintImage } from "@/components/ComplaintImage";

export default function AdminPriority() {
  const { data: complaints, isLoading } = useQuery<Complaint[]>({
    queryKey: ["admin-priority"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, department:departments(*)")
        .order("priority_score", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as Complaint[];
    },
  });

  const pending = complaints?.filter((c) => c.status !== "RESOLVED") || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-500" /> AI Priority Queue
        </h1>
        <p className="text-sm text-gray-500 mt-1">Complaints sorted by AI priority score — highest first</p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading priority queue..." />
      ) : pending.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<AlertTriangle className="w-12 h-12" />} title="No pending complaints" message="All complaints have been resolved." />
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((c, i) => (
            <Link key={c.id} to={`/admin/complaints/${c.id}`}>
              <Card className="p-4 hover:shadow-card-hover transition">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-10 text-center">
                    <p className="text-xs text-gray-400">#{i + 1}</p>
                  </div>

                  {/* Priority score */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <p className={`text-3xl font-bold ${priorityColor(c.priority_score)}`}>{c.priority_score}</p>
                    <Badge className={severityColor(c.severity)}>{c.severity}</Badge>
                  </div>

                  <ComplaintImage path={c.image_url} alt={c.title} className="h-16 w-20 flex-shrink-0 rounded-lg object-cover" placeholderClassName="h-16 w-20 flex-shrink-0 rounded-lg" />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{c.tracking_id}</span>
                    </div>
                    <p className="text-sm font-semibold text-navy-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {categoryLabel(c.category)} · {c.department?.name || "Unassigned"} · {c.address || "Nagpur"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 italic">{c.ai_reason}</p>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0 hidden sm:block">
                    <span className="text-sm text-brand-600 font-medium flex items-center gap-1">
                      Handle <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
