import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  User,
  Building2,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, Badge, LoadingState, ErrorState, Select, Button, Input, Textarea, Breadcrumb as BreadcrumbNav } from "@/components/ui";
import { ComplaintImage } from "@/components/ComplaintImage";
import {
  categoryLabel,
  severityColor,
  statusColor,
  priorityColor,
  formatDate,
  STATUSES,
} from "@/utils/constants";
import type { Complaint, Department, Profile, StatusHistory } from "@/types";

export default function AdminComplaintDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newDept, setNewDept] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [priority, setPriority] = useState(50);
  const [adminNote, setAdminNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [timelineNote, setTimelineNote] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: complaint, isLoading, error } = useQuery<Complaint>({
    queryKey: ["admin-complaint", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, department:departments(*)")
        .eq("id", id!)
        .single();
      if (error || !data) throw new Error("Complaint could not be loaded");
      return data as unknown as Complaint;
    },
    enabled: !!id,
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data as Department[];
    },
  });

  const { data: citizen } = useQuery<Profile>({
    queryKey: ["complaint-citizen", complaint?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", complaint!.user_id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!complaint?.user_id,
  });

  const { data: history } = useQuery<StatusHistory[]>({
    queryKey: ["admin-complaint-history", id],
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

  useEffect(() => {
    if (complaint) {
      setNewStatus(complaint.status);
      setNewDept(complaint.department_id || "");
      setPriority(complaint.priority_score);
      setAdminNote(complaint.admin_note || "");
      setResolution(complaint.resolution || "");
    }
  }, [complaint]);

  // Realtime
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`admin-complaint-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "complaints", filter: `id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["admin-complaint", id] })
      )
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  async function handleSave() {
    if (!complaint) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const { error } = await supabase.rpc("admin_update_complaint", {
        p_complaint_id: complaint.id,
        p_status: newStatus,
        p_department_id: newDept || null,
        p_priority_score: priority,
        p_admin_note: adminNote,
        p_resolution: resolution,
        p_timeline_note: timelineNote,
      });
      if (error) throw new Error("Could not update complaint");

      await queryClient.invalidateQueries({ queryKey: ["admin-complaint", id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-complaint-history", id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-all-complaints"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Could not update complaint. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <LoadingState message="Loading complaint..." />;
  if (error) return <ErrorState message="This complaint could not be loaded." />;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <BreadcrumbNav items={[{ label: "Complaints", to: "/admin/complaints" }, { label: complaint?.tracking_id || "" }]} />

      <Link to="/admin/complaints" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-4">
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
            <div className="text-right">
              <p className={`text-3xl font-bold ${priorityColor(complaint.priority_score)}`}>{complaint.priority_score}</p>
              <Badge className={severityColor(complaint.severity)}>{complaint.severity}</Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <ComplaintImage path={complaint.image_url} alt={complaint.title} className="w-full h-48 object-cover" placeholderClassName="h-48" />
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-2">Description</h3>
                <p className="text-sm text-gray-600">{complaint.description}</p>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-500" /> Citizen Details
                </h3>
                {citizen ? (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-navy-800">{citizen.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium text-navy-800">{citizen.phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium text-navy-800">{citizen.role}</span></div>
                  </div>
                ) : <p className="text-sm text-gray-400">Loading citizen...</p>}
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-500" /> Location
                </h3>
                {complaint.latitude && complaint.longitude ? (
                  <>
                    <p className="text-sm text-gray-600 mb-1">{complaint.address || "Nagpur"}</p>
                    <p className="text-xs font-mono text-gray-400 mb-2">{complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}</p>
                    <a href={`https://www.openstreetmap.org/?mlat=${complaint.latitude}&mlon=${complaint.longitude}#map=17/${complaint.latitude}/${complaint.longitude}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline">View on map →</a>
                  </>
                ) : <p className="text-sm text-gray-400">No location recorded</p>}
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" /> AI Analysis
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium text-navy-800">{categoryLabel(complaint.category)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Confidence</span><span className="font-medium text-navy-800">{complaint.ai_confidence}%</span></div>
                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500 mb-1">AI Reasoning</p>
                    <p className="text-sm text-navy-700">{complaint.ai_reason}</p>
                  </div>
                </div>
              </Card>

              {/* Admin actions */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-500" /> Manage Complaint
                </h3>
                <div className="space-y-4">
                  <Select label="Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </Select>
                  <Select label="Department" value={newDept} onChange={(e) => setNewDept(e.target.value)}>
                    <option value="">Unassigned</option>
                    {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                  <Input label="Priority score" type="number" min={0} max={100} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
                  <Textarea label="Admin note" rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Add an internal note" />
                  <Textarea label="Resolution" rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe the resolution" />
                  <Input label="Timeline note" value={timelineNote} onChange={(e) => setTimelineNote(e.target.value)} placeholder="Optional update note" />

                  {saveError && <p className="text-xs text-error-600">{saveError}</p>}
                  {saved && <p className="text-xs text-success-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Updated. Citizen notified.</p>}

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-navy-800 mb-3">Status Timeline</h3>
                <div className="space-y-3">
                  {history && history.length > 0 ? (
                    history.map((h, i) => (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full ${i === history.length - 1 ? "bg-brand-500" : "bg-gray-300"}`} />
                          {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-medium text-navy-800">{h.new_status.replace("_", " ")}</p>
                          {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                          <p className="text-xs text-gray-400">{formatDate(h.created_at)}</p>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-sm text-gray-400">No history</p>}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
