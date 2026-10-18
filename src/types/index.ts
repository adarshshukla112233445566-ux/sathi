export type Role = "CITIZEN" | "ADMIN";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ComplaintStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export type ComplaintCategory =
  | "ROAD_POTHOLE"
  | "GARBAGE"
  | "STREETLIGHT"
  | "WATER"
  | "DRAINAGE"
  | "TRAFFIC"
  | "ENVIRONMENT"
  | "INJURED_ANIMAL"
  | "OTHER";

export interface Profile {
  id: string;
  name: string;
  phone: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  severity: Severity;
  priority_score: number;
  status: ComplaintStatus;
  department_id: string | null;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  location: string;
  city: string;
  priority: number;
  admin_note: string;
  resolution: string;
  image_url: string;
  ai_confidence: number;
  ai_reason: string;
  created_at: string;
  updated_at: string;
  department?: Department | null;
  profiles?: Profile | null;
}

export interface StatusHistory {
  id: string;
  complaint_id: string;
  old_status: string | null;
  new_status: ComplaintStatus;
  updated_by: string | null;
  changed_by: string | null;
  note: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  emergency_available: boolean;
  latitude: number;
  longitude: number;
}

export interface EmergencyService {
  id: string;
  type: "POLICE" | "AMBULANCE" | "FIRE" | "HOSPITAL";
  name: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface TouristLocation {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  latitude: number;
  longitude: number;
}

export interface TransportRoute {
  id: string;
  route_name: string;
  route_type: "BUS" | "METRO";
  stops: string[];
  estimated_duration_min: number;
}

export interface TrafficIncident {
  id: string;
  road_name: string;
  incident_type: string;
  severity: Severity;
  description: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface AnalysisResult {
  category: ComplaintCategory;
  confidence: number;
  severity: Severity;
  priorityScore: number;
  department: string;
  reason: string;
}
