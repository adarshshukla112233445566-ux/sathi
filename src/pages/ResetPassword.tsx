import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Lock } from "lucide-react";
import { supabase } from "@/services/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-5">
        <div className="max-w-md rounded-[25px] border border-white bg-white p-10 text-center shadow-[0_18px_60px_rgba(22,51,88,0.10)]">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success-600" />
          <h1 className="mt-4 text-2xl font-extrabold text-navy-900">Password updated</h1>
          <p className="mt-2 text-sm text-slate-500">You can now sign in with your new password.</p>
          <button onClick={() => navigate("/login")} className="mt-7 h-12 w-full rounded-xl bg-[#073b82] text-sm font-bold text-white hover:bg-[#052f68]">Back to sign in</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-5 py-10">
      <div className="w-full max-w-md rounded-[25px] border border-white bg-white p-8 shadow-[0_18px_60px_rgba(22,51,88,0.10)] sm:p-10">
        <h1 className="text-2xl font-extrabold text-[#102f5f]">Set a new password</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a strong password for your Indian Saathi AI account.</p>
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block text-sm font-bold text-navy-900">New password
            <div className="relative mt-2"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter new password" className="h-12 w-full rounded-xl border border-[#d9e1ec] pl-11 pr-4 text-sm outline-none focus:border-[#073b82] focus:ring-4 focus:ring-blue-50" /></div>
          </label>
          <label className="block text-sm font-bold text-navy-900">Confirm password
            <div className="relative mt-2"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Re-enter new password" className="h-12 w-full rounded-xl border border-[#d9e1ec] pl-11 pr-4 text-sm outline-none focus:border-[#073b82] focus:ring-4 focus:ring-blue-50" /></div>
          </label>
          <button disabled={loading} className="h-12 w-full rounded-xl bg-[#073b82] text-sm font-bold text-white transition hover:bg-[#052f68] disabled:opacity-60">{loading ? "Updating..." : "Update password"}</button>
        </form>
      </div>
    </main>
  );
}
