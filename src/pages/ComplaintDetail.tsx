import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, Badge, LoadingState, ErrorState, Breadcrumb as BreadcrumbNav } from "@/components/ui";
import {
  categoryLabel,
  severityColor,
  statusColor,
  priorityColor,
  formatDate,
} from "@/utils/constants";
import type { Complaint, StatusHistory } from "@/types";
import { ComplaintImage } from "@/components/ComplaintImage";

export default function ComplaintDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data: complaint, isLoading, error } = useQuery<Complaint>({
    queryKey: ["complaint", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, department:departments(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as Complaint;
    },
    enabled: !!id,
  });

  const { data: history } = useQuery<StatusHistory[]>({
    queryKey: ["complaint-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaint_status_history")
        .select("*")
        .eq("complaint_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as StatusHistory[];
    },
    enabled: !!id,
  });

  // Realtime: listen for complaint updates
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`complaint-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "complaints", filter: `id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["complaint", id] });
          queryClient.invalidateQueries({ queryKey: ["complaint-history", id] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaint_status_history", filter: `complaint_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["complaint-history", id] })
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  if (isLoading) return <LoadingState message="Loading complaint..." />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <BreadcrumbNav items={[{ label: "My Complaints", to: "/complaints" }, { label: complaint?.tracking_id || "" }]} />

      <Link to="/complaints" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to complaints
      </Link>

      {complaint && (
        <>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono text-gray-400">{complaint.tracking_id}</span>
                <Badge className={statusColor(complaint.status)}>{complaint.status.replace("_", " ")}</Badge>
              </div>
              <h1 className="text-2xl font-bold text-navy-900">{complaint.title}</h1>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-3xl font-bold ${priorityColor(complaint.priority_score)}`}>{complaint.priority_score}</p>
              <Badge className={severityColor(complaint.severity)}>{complaint.severity}</Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                {complaint.image_url ? (
                  <ComplaintImage path={complaint.image_url} alt={complaint.title} className="w-full h-48 object-cover" placeholderClassName="h-48" />
                ) : (
                  <div className="p-8 flex flex-col items-center text-gray-300"><ImageIcon className="w-10 h-10 mb-2" /><p className="text-sm text-gray-400">No photo uploaded</p></div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-2">Description</h3>
                <p className="text-sm text-gray-600">{complaint.description}</p>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-500" /> Location
                </h3>
                {complaint.latitude && complaint.longitude ? (
                  <>
                    <p className="text-sm text-gray-600 mb-2">{complaint.address || "Nagpur"}</p>
                    <p className="text-xs font-mono text-gray-400 mb-3">
                      {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${complaint.latitude}&mlon=${complaint.longitude}#map=17/${complaint.latitude}/${complaint.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-600 font-medium hover:underline"
                    >
                      View on map →
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No location recorded</p>
                )}
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" /> AI Analysis
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-navy-800">{categoryLabel(complaint.category)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Confidence</span>
                    <span className="font-medium text-navy-800">{complaint.ai_confidence}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Department</span>
                    <span className="font-medium text-navy-800">{complaint.department?.name || "Unassigned"}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500 mb-1">AI Reasoning</p>
                    <p className="text-sm text-navy-700">{complaint.ai_reason}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-500" /> Status Timeline
                </h3>
                <div className="space-y-3">
                  {history && history.length > 0 ? (
                    history.map((h, i) => (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full ${i === history.length - 1 ? "bg-brand-500" : "bg-gray-300"}`} />
                          {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-medium text-navy-800">
                            {h.new_status.replace("_", " ")}
                            {h.old_status && <span className="text-xs text-gray-400"> from {h.old_status.replace("_", " ")}</span>}
                          </p>
                          {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                          <p className="text-xs text-gray-400">{formatDate(h.created_at)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No status history yet</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
