import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  BellRing,
  ChevronDown,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { supabase } from "@/services/supabase";

const INDIA_GATE_IMAGE =
  "https://images.pexels.com/photos/19756444/pexels-photo-19756444.jpeg?auto=compress&cs=tinysrgb&w=1800";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;
type LoginMode = "citizen" | "admin";

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/image.svg" alt="Indian Saathi AI" className="h-14 w-14 shrink-0 object-contain" />
      <div>
        <p className={`text-[19px] font-extrabold leading-none tracking-tight ${light ? "text-white" : "text-navy-900"}`}>
          INDIAN SAATHI <span className="text-saffron-500">AI</span>
        </p>
        <p className={`mt-1 text-[10px] font-medium ${light ? "text-white/80" : "text-navy-700"}`}>
          One AI-powered platform for a smarter, safer India.
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<LoginMode>("citizen");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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

      if (mode === "admin") {
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
      }

      if (remember) localStorage.setItem("indian-saathi-remember", "true");
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || (mode === "admin" ? "/admin" : "/dashboard"), { replace: true });
    } catch {
      setServerError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    await authenticate(data.email, data.password);
  }

  function switchMode(next: LoginMode) {
    setMode(next);
    setServerError("");
    setValue("email", "");
    setValue("password", "");
  }

  async function useDemoAdmin() {
    setValue("email", "admin2@indiasaathi.ai");
    setValue("password", "S4aathi#2026Adm");
    await authenticate("admin2@indiasaathi.ai", "S4aathi#2026Adm");
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-navy-900 lg:grid lg:grid-cols-[minmax(0,1.03fr)_minmax(520px,0.97fr)]">
      <section className="relative min-h-[620px] overflow-hidden bg-[#f5d5b5] lg:min-h-screen">
        <img
          src={INDIA_GATE_IMAGE}
          alt="India Gate at sunrise"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,246,232,.82)_0%,rgba(255,246,232,.36)_45%,rgba(255,203,135,.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,20,45,.28)_0%,transparent_34%,rgba(255,247,234,.12)_100%)]" />

        <div className="relative z-10 flex h-full min-h-[620px] flex-col px-7 py-8 sm:px-12 lg:px-[7.5%] lg:py-12 xl:px-[9%]">
          <BrandMark />

          <div className="mt-20 max-w-[500px] sm:mt-24 lg:mt-[15vh]">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-navy-700">A smarter India starts here</p>
            <h1 className="text-[clamp(2.7rem,4.7vw,4.35rem)] font-extrabold leading-[1.06] tracking-[-0.045em] text-[#073b82]">
              Your AI-powered Saathi
              <br />
              for a <span className="text-saffron-500">Smarter</span> <span className="text-success-600">India</span>
            </h1>
            <p className="mt-6 max-w-[440px] text-base font-medium leading-7 text-navy-800 sm:text-lg">
              Report civic issues, find essential services, get emergency assistance and connect with the right department — all from one platform.
            </p>
          </div>

          <div className="mt-9 grid max-w-[530px] grid-cols-3 gap-3 sm:gap-6">
            {[
              { icon: Sparkles, label: "AI-powered", sub: "civic assistance" },
              { icon: ShieldCheck, label: "Smart complaint", sub: "routing" },
              { icon: BellRing, label: "Emergency &", sub: "essential services" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-navy-900">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/55 shadow-sm backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-[#073b82]" />
                </div>
                <p className="text-xs font-bold leading-4 sm:text-sm">{label}<br />{sub}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-auto hidden max-w-[430px] overflow-hidden rounded-[28px] border border-white/20 bg-navy-950/75 px-6 py-4 text-white shadow-xl backdrop-blur-md sm:block lg:mb-28">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60">
                <Sparkles className="h-5 w-5 text-saffron-400" />
              </div>
              <p className="text-sm font-semibold leading-6">A cleaner <span className="mx-2 text-saffron-400">•</span> Safer <span className="mx-2 text-success-400">•</span> More connected<br />India, together with AI</p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-9 -left-8 h-32 w-[62%] rotate-[-8deg] rounded-[50%] border-[10px] border-saffron-500 opacity-90" />
        <div className="pointer-events-none absolute -bottom-16 -left-5 h-32 w-[68%] rotate-[-8deg] rounded-[50%] border-[10px] border-white opacity-95" />
        <div className="pointer-events-none absolute -bottom-24 left-3 h-32 w-[70%] rotate-[-8deg] rounded-[50%] border-[10px] border-success-600 opacity-90" />
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="pointer-events-none absolute right-0 top-0 h-24 w-64 overflow-hidden opacity-90">
          <div className="absolute -right-14 -top-16 h-32 w-80 rotate-12 rounded-[50%] border-[7px] border-saffron-500" />
          <div className="absolute -right-14 -top-12 h-32 w-80 rotate-12 rounded-[50%] border-[7px] border-white" />
          <div className="absolute -right-14 -top-8 h-32 w-80 rotate-12 rounded-[50%] border-[7px] border-success-600" />
        </div>
        <div className="pointer-events-none absolute bottom-0 right-0 h-36 w-72 opacity-10 [background-image:radial-gradient(circle_at_50%_100%,#073b82_2px,transparent_3px),linear-gradient(90deg,transparent,rgba(19,136,8,.4))] [background-size:22px_22px,100%_100%]" />

        <div className="relative z-10 w-full max-w-[470px]">
          <div className="mb-6 flex justify-end">
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#d8e0eb] bg-white px-4 py-2.5 text-xs font-semibold text-navy-700 shadow-sm transition hover:border-[#b8c7dc]">
              <Globe2 className="h-4 w-4 text-[#073b82]" /> English <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-[25px] border border-white bg-white/95 p-7 shadow-[0_18px_60px_rgba(22,51,88,0.10)] sm:p-10">
            <BrandMark />

            {/* Login mode tabs */}
            <div className="mt-7 grid grid-cols-2 gap-1 rounded-xl bg-[#eef3f9] p-1">
              <button
                type="button"
                onClick={() => switchMode("citizen")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
                  mode === "citizen"
                    ? "bg-white text-[#073b82] shadow-sm"
                    : "text-slate-500 hover:text-navy-700"
                }`}
              >
                <User className="h-4 w-4" /> Citizen
              </button>
              <button
                type="button"
                onClick={() => switchMode("admin")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
                  mode === "admin"
                    ? "bg-white text-success-700 shadow-sm"
                    : "text-slate-500 hover:text-navy-700"
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </button>
            </div>

            <div className="mt-6">
              <h2 className="text-[2rem] font-extrabold tracking-[-0.04em] text-[#102f5f]">
                {mode === "admin" ? "Admin Portal" : "Welcome back"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {mode === "admin"
                  ? "Secure sign-in for India Saathi AI administrators"
                  : "Sign in to continue to Indian Saathi AI"}
              </p>
            </div>

            {serverError && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-navy-900">
                  {mode === "admin" ? "Admin email address" : "Email address"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder={mode === "admin" ? "admin2@indiasaathi.ai" : "Enter your email address"}
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
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-navy-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-600">
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-[#073b82]" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="font-bold text-[#0b55a0] hover:underline">Forgot password?</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-[0_8px_18px_rgba(7,59,130,.2)] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  mode === "admin"
                    ? "bg-success-700 hover:bg-success-800 shadow-[0_8px_18px_rgba(19,136,8,.2)]"
                    : "bg-[#073b82] hover:bg-[#052f68]"
                }`}
              >
                {loading
                  ? (mode === "admin" ? "Authenticating..." : "Signing in...")
                  : (mode === "admin" ? "Admin Sign In" : "Sign In")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {mode === "admin" && (
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
            )}

            {mode === "citizen" ? (
              <p className="mt-7 text-center text-sm text-slate-500">
                Don't have an account? <Link to="/register" className="font-bold text-[#0b55a0] hover:underline">Create an account</Link>
              </p>
            ) : (
              <p className="mt-7 text-center text-sm text-slate-500">
                <Link to="/login" className="font-bold text-[#0b55a0] hover:underline">← Back to citizen login</Link>
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
