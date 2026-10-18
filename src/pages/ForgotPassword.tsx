import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/services/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) setError(resetError.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-5 py-10">
      <div className="w-full max-w-md rounded-[25px] border border-white bg-white p-8 shadow-[0_18px_60px_rgba(22,51,88,0.10)] sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-saffron-500 bg-white"><Sparkles className="h-5 w-5 text-[#073b82]" /></div>
          <div><p className="text-lg font-extrabold text-navy-900">INDIAN SAATHI <span className="text-saffron-500">AI</span></p><p className="text-[10px] text-slate-500">Your smarter, safer India companion</p></div>
        </div>
        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success-600" />
            <h1 className="mt-4 text-2xl font-extrabold text-navy-900">Check your inbox</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">If an account exists for {email}, we sent a password reset link.</p>
            <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#0b55a0] hover:underline"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-[#102f5f]">Reset your password</h1>
            <p className="mt-1 text-sm text-slate-500">Enter your email and we’ll send you a secure reset link.</p>
            {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block text-sm font-bold text-navy-900">Email address
                <div className="relative mt-2"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" className="h-12 w-full rounded-xl border border-[#d9e1ec] pl-11 pr-4 text-sm outline-none focus:border-[#073b82] focus:ring-4 focus:ring-blue-50" /></div>
              </label>
              <button disabled={loading} className="h-12 w-full rounded-xl bg-[#073b82] text-sm font-bold text-white transition hover:bg-[#052f68] disabled:opacity-60">{loading ? "Sending..." : "Send reset link"}</button>
            </form>
            <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#0b55a0] hover:underline"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
          </>
        )}
      </div>
    </main>
  );
}
