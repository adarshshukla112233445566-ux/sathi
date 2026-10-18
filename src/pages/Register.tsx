import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, User, Phone, Mail, Lock } from "lucide-react";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");
    setLoading(true);
    try {
      await signUp(data.email, data.password, data.name, data.phone);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">India Saathi AI</h1>
          <p className="text-sm text-navy-300 mt-1">Join India's smart civic platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-navy-900 mb-1">Create account</h2>
          <p className="text-sm text-gray-500 mb-6">Register as a citizen</p>

          {serverError && (
            <div className="mb-4 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  {...register("name")}
                  placeholder="Rahul Sharma"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition"
                />
              </div>
              {errors.name && <p className="text-xs text-error-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition"
                />
              </div>
              {errors.phone && <p className="text-xs text-error-600 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition"
                />
              </div>
              {errors.email && <p className="text-xs text-error-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  {...register("password")}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition"
                />
              </div>
              {errors.password && <p className="text-xs text-error-600 mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
