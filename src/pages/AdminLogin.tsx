import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/services/supabase";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function authenticate(email: string, password: string) {
    setServerError("");
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.session) {
        throw new Error("auth failed");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.session.user.id)
        .maybeSingle();

      if (profile?.role !== "ADMIN") {
        setServerError("This account does not have administrator access.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      navigate("/admin", { replace: true });
    } catch {
      setServerError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    await authenticate(data.email, data.password);
  }

  async function useDemoAdmin() {
    setValue("email", "admin2@indiasaathi.ai");
    setValue("password", "S4aathi#2026Adm");
    await authenticate("admin2@indiasaathi.ai", "S4aathi#2026Adm");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-navy-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_50%_50%,rgba(7,59,130,0.4)_0%,transparent_70%)]" />
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <img src="/image.svg" alt="Indian Saathi AI" className="h-16 w-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Administrator Portal</h1>
          <p className="mt-1.5 text-sm text-white/60">Secure access for India Saathi AI administrators</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-7 shadow-2xl sm:p-8">
          {serverError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-navy-900">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="admin2@indiasaathi.ai"
                  className="h-12 w-full rounded-xl border border-[#d9e1ec] bg-white pl-11 pr-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-[#073b82] focus:ring-4 focus:ring-blue-50"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-navy-900">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-[#d9e1ec] bg-white pl-11 pr-12 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-[#073b82] focus:ring-4 focus:ring-blue-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-navy-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#073b82] text-sm font-bold text-white shadow-[0_8px_18px_rgba(7,59,130,.2)] transition hover:bg-[#052f68] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Admin Sign In"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <button
            type="button"
            onClick={useDemoAdmin}
            disabled={loading}
            className="mt-5 flex w-full items-center gap-3 rounded-xl bg-[#f0f9f0] px-4 py-3.5 text-left transition hover:bg-[#e8f5e8] disabled:opacity-60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8f0d8] text-success-700">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-success-700">Demo Admin Access</span>
              <span className="mt-0.5 block text-xs text-slate-500">admin2@indiasaathi.ai · S4aathi#2026Adm</span>
            </span>
            <ArrowRight className="h-4 w-4 text-success-700" />
          </button>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-navy-700 transition">
              Citizen login →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
