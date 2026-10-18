import type { ComplaintCategory, ComplaintStatus, Severity } from "@/types";

export const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: "ROAD_POTHOLE", label: "Road / Pothole" },
  { value: "GARBAGE", label: "Garbage" },
  { value: "STREETLIGHT", label: "Streetlight" },
  { value: "WATER", label: "Water" },
  { value: "DRAINAGE", label: "Drainage" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "ENVIRONMENT", label: "Environment" },
  { value: "INJURED_ANIMAL", label: "Injured Animal" },
  { value: "OTHER", label: "Other" },
];

export const STATUSES: ComplaintStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

export const STATUS_FLOW: Record<ComplaintStatus, ComplaintStatus | null> = {
  SUBMITTED: "UNDER_REVIEW",
  UNDER_REVIEW: "ASSIGNED",
  ASSIGNED: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
  REJECTED: null,
};

export function categoryLabel(cat: string): string {
  return CATEGORIES.find((c) => c.value === cat)?.label || cat;
}

export function severityColor(sev: Severity): string {
  switch (sev) {
    case "CRITICAL": return "bg-error-100 text-error-700 border-error-200";
    case "HIGH": return "bg-warning-100 text-warning-700 border-warning-200";
    case "MEDIUM": return "bg-brand-100 text-brand-700 border-brand-200";
    case "LOW": return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function statusColor(status: ComplaintStatus): string {
  switch (status) {
    case "SUBMITTED": return "bg-gray-100 text-gray-700 border-gray-200";
    case "UNDER_REVIEW": return "bg-accent-100 text-accent-700 border-accent-200";
    case "ASSIGNED": return "bg-brand-100 text-brand-700 border-brand-200";
    case "IN_PROGRESS": return "bg-warning-100 text-warning-700 border-warning-200";
    case "RESOLVED": return "bg-success-100 text-success-700 border-success-200";
    case "REJECTED": return "bg-error-100 text-error-700 border-error-200";
  }
}

export function priorityColor(score: number): string {
  if (score >= 90) return "text-error-600";
  if (score >= 70) return "text-warning-600";
  if (score >= 40) return "text-brand-600";
  return "text-gray-500";
}

export function priorityBg(score: number): string {
  if (score >= 90) return "bg-error-50 border-error-200";
  if (score >= 70) return "bg-warning-50 border-warning-200";
  if (score >= 40) return "bg-brand-50 border-brand-200";
  return "bg-gray-50 border-gray-200";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const NAGPUR_CENTER: [number, number] = [21.1458, 79.0882];
