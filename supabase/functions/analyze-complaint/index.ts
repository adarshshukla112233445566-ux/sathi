// AI complaint analysis edge function.
// Uses Google Gemini when GEMINI_API_KEY is configured, otherwise falls back
// to deterministic keyword-based analysis so the app always works.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  category?: string;
  description?: string;
  title?: string;
  latitude?: number;
  longitude?: number;
}

interface AnalysisResult {
  category: string;
  confidence: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priorityScore: number;
  department: string;
  reason: string;
}

const CATEGORY_DEPARTMENT: Record<string, string> = {
  ROAD_POTHOLE: "Road Maintenance",
  GARBAGE: "Waste Management",
  STREETLIGHT: "Electrical Department",
  WATER: "Water Department",
  DRAINAGE: "Drainage Department",
  TRAFFIC: "Traffic Department",
  ENVIRONMENT: "Waste Management",
  INJURED_ANIMAL: "Animal Rescue",
  OTHER: "Emergency Response",
};

const EMERGENCY_KEYWORDS = [
  "accident", "fire", "bleeding", "unconscious", "drowning", "collapse",
  "electrocution", "gas leak", "explosion", "critical", "emergency",
];

const HIGH_KEYWORDS = [
  "deep", "large", "big", "broken", "dead", "overflow", "stuck",
  "stray", "injured", "hit", "waste", "leakage", "not working",
];

function deterministicAnalysis(req: AnalysisRequest): AnalysisResult {
  const text = `${req.title || ""} ${req.description || ""} ${req.category || ""}`.toLowerCase();
  const category = (req.category || "OTHER").toUpperCase();

  let severity: AnalysisResult["severity"] = "MEDIUM";
  let baseScore = 50;

  if (EMERGENCY_KEYWORDS.some((k) => text.includes(k))) {
    severity = "CRITICAL";
    baseScore = 92;
  } else if (HIGH_KEYWORDS.some((k) => text.includes(k))) {
    severity = "HIGH";
    baseScore = 75;
  } else if (text.includes("small") || text.includes("minor") || text.includes("slight")) {
    severity = "LOW";
    baseScore = 30;
  }

  // category-based adjustment
  const catBoost: Record<string, number> = {
    ROAD_POTHOLE: 5,
    GARBAGE: -5,
    STREETLIGHT: 0,
    WATER: 3,
    DRAINAGE: 5,
    TRAFFIC: 8,
    ENVIRONMENT: -3,
    INJURED_ANIMAL: 10,
    OTHER: 0,
  };
  baseScore += catBoost[category] || 0;

  const priorityScore = Math.max(0, Math.min(100, baseScore));
  if (priorityScore >= 90) severity = "CRITICAL";
  else if (priorityScore >= 70) severity = "HIGH";
  else if (priorityScore >= 40) severity = "MEDIUM";
  else severity = "LOW";

  const department = CATEGORY_DEPARTMENT[category] || "Emergency Response";

  const reasons: Record<string, string> = {
    CRITICAL: "Immediate safety risk detected. Requires urgent department response.",
    HIGH: "Significant issue affecting public safety or convenience.",
    MEDIUM: "Moderate civic issue requiring scheduled attention.",
    LOW: "Minor issue, low immediate impact.",
  };

  return {
    category,
    confidence: 85,
    severity,
    priorityScore,
    department,
    reason: reasons[severity],
  };
}

async function geminiAnalysis(req: AnalysisRequest): Promise<AnalysisResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("no key");

  const prompt = `Analyze this civic complaint for Nagpur city and return ONLY valid JSON (no markdown).
Complaint title: ${req.title || ""}
Description: ${req.description || ""}
Category hint: ${req.category || "OTHER"}

Return JSON with exactly these fields:
{
  "category": "ROAD_POTHOLE" | "GARBAGE" | "STREETLIGHT" | "WATER" | "DRAINAGE" | "TRAFFIC" | "ENVIRONMENT" | "INJURED_ANIMAL" | "OTHER",
  "confidence": number 0-100,
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "priorityScore": number 0-100 (CRITICAL 90-100, HIGH 70-89, MEDIUM 40-69, LOW 0-39),
  "department": one of Road Maintenance, Waste Management, Electrical Department, Water Department, Drainage Department, Traffic Department, Animal Rescue, Emergency Response,
  "reason": short explanation
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
      }),
    }
  );

  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonMatch = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(jsonMatch);

  // validate
  const validCats = ["ROAD_POTHOLE","GARBAGE","STREETLIGHT","WATER","DRAINAGE","TRAFFIC","ENVIRONMENT","INJURED_ANIMAL","OTHER"];
  if (!validCats.includes(parsed.category)) parsed.category = req.category || "OTHER";
  if (typeof parsed.priorityScore !== "number" || parsed.priorityScore < 0 || parsed.priorityScore > 100) {
    parsed.priorityScore = 50;
  }
  if (!["CRITICAL","HIGH","MEDIUM","LOW"].includes(parsed.severity)) parsed.severity = "MEDIUM";
  if (typeof parsed.confidence !== "number") parsed.confidence = 80;
  if (typeof parsed.reason !== "string") parsed.reason = "AI analysis complete.";
  if (typeof parsed.department !== "string" || !parsed.department) {
    parsed.department = CATEGORY_DEPARTMENT[parsed.category] || "Emergency Response";
  }

  return parsed as AnalysisResult;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: AnalysisRequest = await req.json();

    let result: AnalysisResult;
    try {
      result = await geminiAnalysis(body);
    } catch {
      result = deterministicAnalysis(body);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
