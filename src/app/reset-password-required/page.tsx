"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordRequiredPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setEmail(user.email ?? null);
      setRole(profile?.role ?? null);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [router, supabase]);

  const redirectToPortal = () => {
    switch (role) {
      case "admin":
        router.replace("/portal/admin");
        break;
      case "teacher":
        router.replace("/portal/teacher");
        break;
      case "parent":
        router.replace("/portal/parent");
        break;
      case "student":
        router.replace("/portal/student");
        break;
      default:
        router.replace("/");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { require_password_reset: false },
    });

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    redirectToPortal();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-sm text-gray-600">
        Verifying session...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl border border-gray-100 p-8 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a962] font-bold">Security Checkpoint</p>
          <h1 className="text-2xl font-serif text-gray-900">Reset Your Password</h1>
          <p className="text-sm text-gray-600">
            {email ? `${email}` : "Your account"} requires a password reset before accessing the portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl focus:ring-2 focus:ring-[#c9a962]/20 outline-none transition-all"
              placeholder="Min 12 characters"
              required
              minLength={12}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#f8f9fa] border-none p-4 rounded-xl focus:ring-2 focus:ring-[#c9a962]/20 outline-none transition-all"
              required
              minLength={12}
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#1a1a1a] text-[#c9a962] text-[10px] tracking-[0.35em] uppercase font-bold rounded-xl hover:bg-[#c9a962] hover:text-white transition-all duration-500 shadow-xl shadow-[#1a1a1a]/10 disabled:opacity-60"
          >
            {submitting ? "Updating..." : "Set New Password"}
          </button>
        </form>

        <p className="text-[11px] text-gray-500 text-center">
          The previous one-time password is no longer valid after this change.
        </p>
      </div>
    </div>
  );
}
