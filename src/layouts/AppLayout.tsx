import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Map as MapIcon,
  Bell,
  Home,
  User,
  LogOut,
  Shield,
  ClipboardList,
  Siren,
  Hospital,
  Bus,
  Car,
  Sparkles,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { useRole } from "@/store/auth";
import { useState, type ComponentType } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const citizenNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/report", label: "Report Problem", icon: PlusCircle },
  { to: "/complaints", label: "My Complaints", icon: ClipboardList },
  { to: "/map", label: "City Map", icon: MapIcon },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

const serviceNav: NavItem[] = [
  { to: "/sos", label: "SOS Emergency", icon: Siren },
  { to: "/hospitals", label: "Hospitals", icon: Hospital },
  { to: "/transport", label: "Transport", icon: Bus },
  { to: "/traffic", label: "Traffic", icon: Car },
  { to: "/explore", label: "Explore India", icon: Home },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/complaints", label: "Complaints", icon: ClipboardList },
  { to: "/admin/priority", label: "Priority Queue", icon: Shield },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/map", label: "City Map", icon: MapIcon },
];

const bottomNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/ai-assistant", label: "AI", icon: Sparkles },
  { to: "/report", label: "Report", icon: PlusCircle },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout() {
  const { profile, signOut } = useAuth();
  const role = useRole();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = role === "ADMIN";

  const mainNav = isAdmin ? adminNav : citizenNav;

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-gray-100 z-30">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
          <img src="/image.svg" alt="Indian Saathi AI" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-sm font-bold text-navy-900 leading-tight">India Saathi AI</p>
            <p className="text-[10px] text-brand-600 font-medium tracking-wide">SMARTER SAFER INDIA</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-navy-600 hover:bg-gray-50"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}

          {!isAdmin && (
            <>
              <p className="px-3 pt-4 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Services
              </p>
              {serviceNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-navy-600 hover:bg-gray-50"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-sm">
              {profile?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-800 truncate">{profile?.name}</p>
              <p className="text-xs text-gray-400 truncate">{isAdmin ? "Administrator" : "Citizen"}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-100 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/image.svg" alt="Indian Saathi AI" className="h-9 w-9 object-contain" />
          <span className="text-sm font-bold text-navy-900">India Saathi AI</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-navy-950/40" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-14 inset-x-0 bg-white max-h-[calc(100vh-3.5rem)] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-3 space-y-1" onClick={() => setMobileMenuOpen(false)}>
              {mainNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                      isActive ? "bg-brand-50 text-brand-700" : "text-navy-600"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
              {!isAdmin &&
                serviceNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                        isActive ? "bg-brand-50 text-brand-700" : "text-navy-600"
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-error-600"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <main className="min-h-screen pt-14 lg:pt-0 pb-20 lg:pb-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30 flex items-center justify-around h-16 px-2">
        {bottomNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition ${
                isActive ? "text-brand-600" : "text-gray-400"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
