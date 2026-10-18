import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PawPrint, Camera, MapPin, X, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/store/auth";
import { analyzeComplaint, uploadImage } from "@/services/ai";
import { Button, Card, Textarea, Select } from "@/components/ui";

const ANIMAL_TYPES = ["Dog", "Cat", "Cow", "Bird", "Monkey", "Other"];
const CONDITIONS = ["Injured", "Sick", "Stranded", "Trapped", "Deceased"];

export default function ReportAnimal() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [animalType, setAnimalType] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [complaintId, setComplaintId] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function captureLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setError("Could not access location"); setLocating(false); }
    );
  }

  async function submit() {
    if (!animalType || !condition || !description || !session) { setError("Fill all fields"); return; }
    setSubmitting(true);
    setError("");
    try {
      const analysis = await analyzeComplaint({
        category: "INJURED_ANIMAL",
        title: `${condition} ${animalType.toLowerCase()}`,
        description,
        latitude: location?.lat,
        longitude: location?.lng,
      });

      let imageUrl = "";
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const { data: dept } = await supabase
        .from("departments")
        .select("id")
        .eq("name", "Animal Rescue")
        .maybeSingle();

      const { data, error } = await supabase.rpc("create_complaint", {
        p_title: `${condition} ${animalType}`,
        p_description: description,
        p_category: "INJURED_ANIMAL",
        p_severity: analysis.severity,
        p_priority_score: analysis.priorityScore,
        p_department_id: dept?.id || null,
        p_latitude: location?.lat || null,
        p_longitude: location?.lng || null,
        p_location: "Nagpur",
        p_city: "Nagpur",
        p_image_url: imageUrl,
        p_ai_confidence: analysis.confidence,
        p_ai_reason: analysis.reason,
      });

      if (error || !data) throw new Error("Could not submit animal report");
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["admin-priority"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      setTrackingId(data.tracking_id);
      setComplaintId(data.id);
      setDone(data.tracking_id);
    } catch {
      setError("Could not submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-success-600" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900 text-center">Animal Rescue Report Submitted</h1>
        <p className="text-sm text-gray-500 mt-2">Routed to Animal Rescue department.</p>
        <div className="mt-6 rounded-2xl bg-brand-50 border border-brand-200 px-8 py-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Tracking ID</p>
          <p className="text-2xl font-bold text-brand-700 font-mono">{trackingId}</p>
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Dashboard</Button>
          <Button onClick={() => navigate(`/complaints/${complaintId}`)}>Track Report</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <PawPrint className="w-6 h-6 text-brand-500" /> Report Injured Animal
        </h1>
        <p className="text-sm text-gray-500 mt-1">Report an injured or stranded animal for rescue</p>
      </div>

      <Card className="p-6 space-y-4">
        {error && (
          <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">{error}</div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Animal Type" value={animalType} onChange={(e) => setAnimalType(e.target.value)}>
            <option value="">Select animal</option>
            {ANIMAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="Condition" value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="">Select condition</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>

        <Textarea
          label="Description"
          rows={3}
          placeholder="Describe the animal's condition and location..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Photo */}
        {!imagePreview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-300 p-8 text-center transition"
          >
            <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-navy-700">Upload photo of animal</p>
          </button>
        ) : (
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imagePreview} alt="Animal" className="w-full h-48 object-cover" />
            <button onClick={() => { setImageFile(null); setImagePreview(""); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-navy-950/60 text-white flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        {/* Location */}
        <button
          onClick={captureLocation}
          disabled={locating}
          className="w-full rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-300 bg-brand-50/30 p-6 text-center transition"
        >
          {locating ? <Loader2 className="w-6 h-6 text-brand-500 mx-auto mb-1 animate-spin" /> : <MapPin className="w-6 h-6 text-brand-500 mx-auto mb-1" />}
          <p className="text-sm font-medium text-navy-700">
            {location ? `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Capture GPS Location"}
          </p>
        </button>

        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PawPrint className="w-4 h-4" />}
          {submitting ? "Submitting..." : "Submit Animal Report"}
        </Button>
      </Card>
    </div>
  );
}
