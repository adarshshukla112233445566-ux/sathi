import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Mail, Phone, Shield, LogOut, Bell, MapPin } from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";

export default function Profile() {
  const { profile, session, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === "ADMIN";

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account details</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-2xl">
            {profile?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-lg font-bold text-navy-900">{profile?.name}</p>
            <Badge className={isAdmin ? "bg-brand-100 text-brand-700 border-brand-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
              {isAdmin ? "Administrator" : "Citizen"}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-navy-800 ml-auto">{session?.user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Phone</span>
            <span className="font-medium text-navy-800 ml-auto">{profile?.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Role</span>
            <span className="font-medium text-navy-800 ml-auto">{profile?.role}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card to="/notifications" className="p-4">
          <Bell className="w-6 h-6 text-brand-500 mb-2" />
          <p className="text-sm font-medium text-navy-800">Notifications</p>
        </Card>
        <Card to="/map" className="p-4">
          <MapPin className="w-6 h-6 text-brand-500 mb-2" />
          <p className="text-sm font-medium text-navy-800">City Map</p>
        </Card>
      </div>

      <Button variant="danger" onClick={handleSignOut} className="w-full">
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>
    </div>
  );
}
