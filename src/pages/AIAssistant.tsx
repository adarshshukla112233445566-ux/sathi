import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Send, User, Bot, Loader2 } from "lucide-react";
import { Card, Button } from "@/components/ui";

interface Message {
  role: "user" | "ai";
  text: string;
  action?: { label: string; to: string };
}

const INTENT_KEYWORDS: Record<string, string[]> = {
  COMPLAINT: ["pothole", "road", "garbage", "waste", "streetlight", "light", "water", "leak", "drainage", "drain", "traffic", "signal", "animal", "dog", "dead", "broken", "kharaab", "kharab", "nahi", "nahi hua", "problem", "issue", "report"],
  HOSPITAL: ["hospital", "doctor", "medical", "clinic", "emergency", "ambulance", "health", "bimar", "aspatal"],
  TRANSPORT: ["bus", "metro", "transport", "route", "travel", "commute", "station", "train"],
  TRAFFIC: ["traffic", "jam", "congestion", "road", "accident", "signal", "raasta"],
  TOURISM: ["tourist", "visit", "explore", "places", "temple", "lake", "park", "heritage", "ghumne", "darshan"],
  EMERGENCY: ["emergency", "sos", "fire", "police", "accident", "help", "bachao", "emergency"],
};

function detectIntent(text: string): string {
  const lower = text.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return intent;
  }
  return "GENERAL";
}

function getResponse(intent: string): Message {
  switch (intent) {
    case "COMPLAINT":
      return {
        role: "ai",
        text: "I can help you report this. Please head to the Report Problem page, select a category, upload a photo, and confirm your location. I'll analyze it with AI and route it to the right department.",
        action: { label: "Report Problem", to: "/report" },
      };
    case "HOSPITAL":
      return {
        role: "ai",
        text: "I can show you nearby hospitals with distance, emergency availability, and contact numbers. Let me take you to the Hospitals page.",
        action: { label: "View Hospitals", to: "/hospitals" },
      };
    case "TRANSPORT":
      return {
        role: "ai",
        text: "Check the Transport page for demo bus and metro routes across Nagpur with stops and estimated travel times.",
        action: { label: "View Transport", to: "/transport" },
      };
    case "TRAFFIC":
      return {
        role: "ai",
        text: "See current traffic incidents, congestion levels, and road alerts on the Traffic page (demo data).",
        action: { label: "View Traffic", to: "/traffic" },
      };
    case "TOURISM":
      return {
        role: "ai",
        text: "Explore Nagpur's parks, lakes, temples, and heritage sites with directions and distances.",
        action: { label: "Explore Nagpur", to: "/explore" },
      };
    case "EMERGENCY":
      return {
        role: "ai",
        text: "If this is a real emergency, please call 100 (Police), 108 (Ambulance), or 101 (Fire) immediately. I can also show you the SOS page with emergency contacts.",
        action: { label: "Open SOS", to: "/sos" },
      };
    default:
      return {
        role: "ai",
        text: "I'm your AI city assistant for Nagpur. You can ask me about reporting civic problems (potholes, garbage, streetlights), finding hospitals, checking traffic, transport routes, or exploring the city. How can I help?",
      };
  }
}

export default function AIAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Namaste! I'm your India Saathi AI assistant. Tell me what's happening in your area — a pothole, broken streetlight, garbage, or ask about hospitals, traffic, and more.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const intent = detectIntent(input);
      const response = getResponse(intent);
      setMessages((m) => [...m, response]);
      setThinking(false);
    }, 800);
  }

  const suggestions = [
    "Road pe bada pothole hai",
    "Streetlight kharab hai",
    "Garbage collection nahi hua",
    "Nearest hospital batao",
    "Traffic kaisa hai",
  ];

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-500" /> AI City Assistant
        </h1>
        <p className="text-sm text-gray-500 mt-1">Ask me anything about your city</p>
      </div>

      <Card className="flex flex-col" >
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[500px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-navy-100 text-navy-700" : "bg-brand-600 text-white"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : ""}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user" ? "bg-navy-900 text-white" : "bg-gray-100 text-navy-800"
                }`}>
                  {msg.text}
                </div>
                {msg.action && (
                  <button
                    onClick={() => navigate(msg.action!.to)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 transition"
                  >
                    {msg.action.label} →
                  </button>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl bg-gray-100 px-4 py-3">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-navy-600 hover:bg-gray-50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-100 p-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about roads, garbage, hospitals, traffic..."
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition"
          />
          <Button onClick={send} disabled={!input.trim() || thinking}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
