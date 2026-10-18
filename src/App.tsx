import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/store/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import AIAssistant from "@/pages/AIAssistant";
import Report from "@/pages/Report";
import ReportAnimal from "@/pages/ReportAnimal";
import Complaints from "@/pages/Complaints";
import ComplaintDetail from "@/pages/ComplaintDetail";
import CityMap from "@/pages/CityMap";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import SOS from "@/pages/SOS";
import Hospitals from "@/pages/Hospitals";
import Transport from "@/pages/Transport";
import Traffic from "@/pages/Traffic";
import Explore from "@/pages/Explore";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminComplaints from "@/pages/AdminComplaints";
import AdminComplaintDetail from "@/pages/AdminComplaintDetail";
import AdminPriority from "@/pages/AdminPriority";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminLogin from "@/pages/AdminLogin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/report" element={<Report />} />
                <Route path="/report/animal" element={<ReportAnimal />} />
                <Route path="/complaints" element={<Complaints />} />
                <Route path="/complaints/:id" element={<ComplaintDetail />} />
                <Route path="/map" element={<CityMap />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/sos" element={<SOS />} />
                <Route path="/hospitals" element={<Hospitals />} />
                <Route path="/transport" element={<Transport />} />
                <Route path="/traffic" element={<Traffic />} />
                <Route path="/explore" element={<Explore />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/complaints" element={<AdminComplaints />} />
                <Route path="/admin/complaints/:id" element={<AdminComplaintDetail />} />
                <Route path="/admin/priority" element={<AdminPriority />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
