import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PlusCircle,
  Camera,
  MapPin,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/store/auth";
import { analyzeComplaint, uploadImage } from "@/services/ai";
import { Button, Card, Input, Textarea, Badge, ErrorState } from "@/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { CATEGORIES, categoryLabel } from "@/utils/constants";
import type { AnalysisResult, ComplaintCategory } from "@/types";

const STEPS = ["Category", "Details", "Photo", "Location", "AI Analysis"];

const schema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Report() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageError, setImageError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Nagpur");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [gpsError, setGpsError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [complaintId, setComplaintId] = useState("");
  const [done, setDone] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const locationMapRef = useRef<HTMLDivElement>(null);
  const locationMapInstance = useRef<L.Map | null>(null);
  const locationMarkerRef = useRef<L.Marker | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function captureLocation() {
    setLocating(true);
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported on this device");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocError(err.message || "Could not access your location. Enter manually below.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const result = await analyzeComplaint({
        category: category || "OTHER",
        title: formTitle,
        description: formDesc,
        latitude: location?.lat,
        longitude: location?.lng,
      });
      setAnalysis(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onDetailsSubmit(data: FormData) {
    setFormTitle(data.title);
    setFormDesc(data.description);
    setStep(2);
  }

  function nextFromCategory() {
    if (!category) return;
    setStep(1);
  }

  function nextFromPhoto() {
    setStep(3);
  }

  async function nextFromLocation() {
    setStep(4);
    await runAnalysis();
  }

  async function submitComplaint() {
    if (!analysis || !category || !session) return;
    if (!formTitle.trim() || !formDesc.trim()) {
      setSubmitError("Title and description are empty. Please go back to the Details step and fill them in.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { data: dept } = await supabase
        .from("departments")
        .select("id")
        .eq("name", analysis.department)
        .maybeSingle();

      const { data, error } = await supabase.rpc("create_complaint", {
        p_title: formTitle,
        p_description: formDesc,
        p_category: analysis.category,
        p_severity: analysis.severity,
        p_priority_score: analysis.priorityScore,
        p_department_id: dept?.id || null,
        p_latitude: location?.lat || null,
        p_longitude: location?.lng || null,
        p_location: address,
        p_city: city,
        p_image_url: imageUrl,
        p_ai_confidence: analysis.confidence,
        p_ai_reason: analysis.reason,
      });

      if (error || !data) {
        const msg = error?.message || "No data returned from database";
        if (import.meta.env.DEV) console.error("[create_complaint]", msg);
        throw new Error(msg);
      }

      setTrackingId(data.tracking_id);
      setComplaintId(data.id);
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["admin-priority"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["map-complaints"] });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      if (import.meta.env.DEV) console.error("[submitComplaint]", detail);
      setSubmitError(
        detail.includes("Invalid complaint")
          ? "Please go back and make sure the title and description are filled in."
          : "Could not submit your complaint. Please try again."
      );
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
        <h1 className="text-2xl font-bold text-navy-900 text-center">Complaint Successfully Submitted</h1>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">
          Complaint submitted successfully. Your report has been analyzed by AI and routed to the relevant department.
        </p>
        <div className="mt-6 rounded-2xl bg-brand-50 border border-brand-200 px-8 py-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Your Tracking ID</p>
          <p className="text-2xl font-bold text-brand-700 font-mono">{trackingId}</p>
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate(`/complaints/${complaintId}`)}>
            Track Complaint
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Report a Civic Problem</h1>
        <p className="text-sm text-gray-500 mt-1">Help make Nagpur better. Report issues in your area.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition ${
                  i < step
                    ? "bg-success-500 text-white"
                    : i === step
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 hidden sm:block ${i <= step ? "text-navy-700 font-medium" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${i < step ? "bg-success-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Category */}
      {step === 0 && (
        <Card className="p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Select a category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  category === cat.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
              >
                <p className="text-sm font-medium text-navy-800">{cat.label}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={nextFromCategory} disabled={!category}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <Card className="p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Describe the problem</h2>
          <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-4">
            <Input
              label="Title"
              placeholder="e.g. Large pothole near Sitabuldi"
              error={errors.title?.message}
              {...register("title")}
            />
            <Textarea
              label="Description"
              rows={4}
              placeholder="Describe the issue in detail..."
              error={errors.description?.message}
              {...register("description")}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button type="submit">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 2: Photo */}
      {step === 2 && (
        <Card className="p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Upload a photo</h2>
          {imageError && (
            <div className="mb-4 rounded-xl bg-error-50 border border-error-200 px-4 py-2.5 text-sm text-error-700">
              {imageError}
            </div>
          )}
          {!imagePreview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 p-12 text-center transition"
            >
              <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-navy-700">Click to upload a photo</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
              <button
                onClick={removeImage}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-navy-950/60 text-white flex items-center justify-center hover:bg-navy-950/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <p className="text-xs text-gray-400 mt-3">A photo helps the AI analyze the problem better.</p>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={nextFromPhoto}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <Card className="p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Confirm your location</h2>
          {locError && (
            <div className="mb-4 rounded-xl bg-warning-50 border border-warning-200 px-4 py-2.5 text-sm text-warning-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {locError}
            </div>
          )}
          <button
            onClick={captureLocation}
            disabled={locating}
            className="w-full rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-300 bg-brand-50/30 p-8 text-center transition mb-4"
          >
            {locating ? (
              <Loader2 className="w-8 h-8 text-brand-500 mx-auto mb-2 animate-spin" />
            ) : (
              <MapPin className="w-8 h-8 text-brand-500 mx-auto mb-2" />
            )}
            <p className="text-sm font-medium text-navy-700">
              {locating ? "Detecting location..." : "Capture GPS Location"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Uses your device's GPS</p>
          </button>

          {location && (
            <div className="rounded-xl bg-success-50 border border-success-200 px-4 py-3 mb-4">
              <p className="text-sm font-medium text-success-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Location captured
              </p>
              <p className="text-xs text-success-600 mt-1">
                Latitude: {location.lat.toFixed(6)}, Longitude: {location.lng.toFixed(6)}
              </p>
            </div>
          )}

          <Input
            label="Address (optional)"
            placeholder="e.g. Sitabuldi, near Traffic Signal"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            label="City"
            placeholder="Nagpur"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={nextFromLocation} disabled={!location}>
              Run AI Analysis <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: AI Analysis */}
      {step === 4 && (
        <Card className="p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" /> AI Analysis
          </h2>

          {analyzing && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
              <p className="text-sm text-gray-500">Analyzing your complaint with AI...</p>
              <p className="text-xs text-gray-400 mt-1">Detecting category, severity, and priority</p>
            </div>
          )}

          {analysisError && !analyzing && <ErrorState message={analysisError} />}

          {analysis && !analyzing && (
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-50 border border-brand-200 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Detected Category</p>
                    <p className="text-sm font-semibold text-navy-800">{categoryLabel(analysis.category)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Severity</p>
                    <Badge className="bg-warning-100 text-warning-700 border-warning-200">{analysis.severity}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Priority Score</p>
                    <p className="text-2xl font-bold text-brand-700">{analysis.priorityScore}<span className="text-sm text-gray-400">/100</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">AI Confidence</p>
                    <p className="text-sm font-semibold text-navy-800">{analysis.confidence}%</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs text-gray-500 mb-1">Routed to Department</p>
                <p className="text-sm font-semibold text-navy-800">{analysis.department}</p>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs text-gray-500 mb-1">AI Reasoning</p>
                <p className="text-sm text-navy-700">{analysis.reason}</p>
              </div>

              {submitError && (
                <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                  {submitError}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={submitComplaint} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  {submitting ? "Submitting..." : "Submit Complaint"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
