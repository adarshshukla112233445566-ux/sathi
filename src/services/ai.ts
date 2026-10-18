import { supabase } from "@/services/supabase";
import type { AnalysisResult, ComplaintCategory } from "@/types";

export async function analyzeComplaint(input: {
  category: string;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
}): Promise<AnalysisResult> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-complaint`;
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`AI analysis failed (${res.status})`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return {
    category: data.category as ComplaintCategory,
    confidence: Number(data.confidence) || 0,
    severity: data.severity,
    priorityScore: Number(data.priorityScore ?? data.priority_score ?? 50),
    department: data.department,
    reason: data.reason,
  };
}

export async function uploadImage(file: File): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error("Please sign in before uploading an image");

  const extension = file.type.split("/")[1] || "jpeg";
  const path = `complaints/${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("complaints").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error("Image upload failed");
  return path;
}

export async function getComplaintImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("complaints").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw new Error("Image unavailable");
  return data.signedUrl;
}
