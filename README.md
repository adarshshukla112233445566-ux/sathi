# Nagpur Saathi AI

**One AI-powered platform for a smarter, safer Nagpur.**

A full-stack, AI-powered smart city web application for reporting and managing civic complaints. Citizens report problems (potholes, garbage, broken streetlights, etc.), an AI service analyzes the complaint to detect category, severity, and priority, and automatically routes it to the correct municipal department. Admins manage the complaint lifecycle, and citizens receive real-time status updates.

## Features

### Core Workflow
- **Citizen Authentication** — Email/password login & registration with JWT sessions
- **Report a Problem** — 5-step wizard: category, details, photo upload, GPS capture, AI analysis
- **AI Complaint Analysis** — Google Gemini API with deterministic fallback; detects category, severity, priority score, and department
- **Tracking ID** — Auto-generated IDs like `NS-2026-000001`
- **Admin Dashboard** — Real-time metrics, complaint management table, priority queue
- **Live Updates** — Supabase Realtime; admin sees new complaints, citizen sees status changes
- **Notifications** — Auto-created when complaint status changes

### Secondary Modules
- **AI City Assistant** — Conversational interface with intent detection (complaint, hospital, transport, traffic, tourism, emergency)
- **City Map** — Leaflet + OpenStreetMap with complaint markers, priority indicators, filters
- **SOS Emergency** — Police, ambulance, fire, hospital buttons; nearest emergency services
- **Hospitals** — Nearby hospital search with distance, emergency availability, directions
- **Transport** — Route planner with demo bus/metro routes
- **Traffic** — Demo traffic incidents and road alerts
- **Injured Animal Reporting** — Specialized form routed to Animal Rescue
- **Explore Nagpur** — Parks, lakes, temples, heritage sites with directions
- **Notifications** — Mark as read, mark all read

## Architecture

```
Frontend (React + Vite + TypeScript)
    ↕ Supabase JS Client (auth, queries, realtime, storage)
Backend (Supabase)
    ├── PostgreSQL Database (tables, RLS, triggers, sequences)
    ├── Auth (email/password, JWT, role-based)
    ├── Edge Functions (AI analysis with Gemini + fallback)
    ├── Storage (complaint photos)
    └── Realtime (live complaint updates)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Routing | React Router v7 |
| State | TanStack Query, React Context |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Map | Leaflet + OpenStreetMap |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT, email/password) |
| AI | Google Gemini API (with deterministic fallback) |
| Realtime | Supabase Realtime (WebSockets) |
| Storage | Supabase Storage |

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Citizen | `demo@nagpursaathi.ai` | `password123` |
| Admin | `admin@nagpursaathi.ai` | `admin123` |
| Citizen | `priya@nagpursaathi.ai` | `password123` |

## Installation

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file (or use the provided one):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key (optional - app works without it)
```

The app works without `GEMINI_API_KEY` — it falls back to deterministic keyword-based analysis.

## Database

The database is PostgreSQL on Supabase with:
- **Tables**: profiles, departments, complaints, complaint_status_history, notifications, emergency_services, hospitals, tourist_locations, transport_routes, traffic_incidents
- **RLS**: Row-level security on all tables with ownership checks
- **Triggers**: Auto-generate tracking IDs, status history, notifications
- **Sequences**: Complaint tracking ID sequence (NS-YYYY-000001)

## Hackathon Demo Flow

1. Login as Citizen (`demo@nagpursaathi.ai` / `password123`)
2. Click "Report Problem"
3. Select category (e.g., Streetlight)
4. Enter title and description
5. Upload a photo
6. Capture GPS location
7. Run AI Analysis — see category, severity, priority score, department
8. Submit Complaint — get tracking ID (e.g., `NS-2026-000011`)
9. Login as Admin (`admin@nagpursaathi.ai` / `admin123`)
10. View complaint in admin dashboard
11. Change status to IN_PROGRESS
12. Login as Citizen — verify notification and updated timeline

## API (Edge Function)

### POST `/functions/v1/analyze-complaint`

Analyzes a complaint using Gemini AI (or deterministic fallback).

**Request:**
```json
{
  "category": "STREETLIGHT",
  "title": "Streetlight not working",
  "description": "Streetlight dead for a week",
  "latitude": 21.1458,
  "longitude": 79.0882
}
```

**Response:**
```json
{
  "category": "STREETLIGHT",
  "confidence": 88,
  "severity": "HIGH",
  "priorityScore": 78,
  "department": "Electrical Department",
  "reason": "Poor night visibility, safety risk for pedestrians."
}
```
