import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-10 h-10 text-brand-500" />
        </div>
        <h1 className="text-6xl font-bold text-navy-900">404</h1>
        <p className="text-lg font-medium text-navy-700 mt-2">Page not found</p>
        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="inline-block mt-6">
          <Button>
            <Home className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
