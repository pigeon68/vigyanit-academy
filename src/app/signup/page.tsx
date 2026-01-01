"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "student" as "student" | "parent" | "teacher",
    studentNumber: "",
    phone: "",
    department: "",
    gradeLevel: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        await supabase.from("profiles").insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          role: formData.role,
        });

        if (formData.role === "student") {
          await supabase.from("students").insert({
            profile_id: authData.user.id,
            student_number: formData.studentNumber,
            grade_level: parseInt(formData.gradeLevel) || null,
          });
        }

        router.push("/login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <main className="bg-[#fafaf9] min-h-screen flex items-center justify-center py-20 noise-overlay">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl px-6"
      >
        <div className="bg-white border border-[#e5e5e5] p-10 lg:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)]">
          <div className="mb-12 text-center">
            <Link href="/" className="inline-block mb-10 group">
              <span className="text-[10px] tracking-[0.4em] uppercase text-[#a1a1aa] group-hover:text-[#c9a962] transition-colors">
                ← Return Home
              </span>
            </Link>
            <h1 className="font-serif text-5xl text-[#1a1a1a] mb-4">
              Create <span className="italic font-light text-[#c9a962]">Registry</span>
            </h1>
            <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase font-medium">
              Join the Academy Collective
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-2 border-red-500 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] tracking-[0.2em] font-bold uppercase text-[#1a1a1a] mb-3">Legal Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateFormData("fullName", e.target.value)}
                  required
                  className="w-full px-0 py-4 bg-transparent border-b border-[#e5e5e5] text-[#1a1a1a] focus:border-[#c9a962] focus:outline-none transition-colors font-light"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.2em] font-bold uppercase text-[#1a1a1a] mb-3">Collective Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => updateFormData("role", e.target.value)}
                  required
                  className="w-full px-0 py-4 bg-transparent border-b border-[#e5e5e5] text-[#1a1a1a] focus:border-[#c9a962] focus:outline-none transition-colors appearance-none font-light"
                >
                  <option value="student">Scholar</option>
                  <option value="parent">Guardian</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.2em] font-bold uppercase text-[#1a1a1a] mb-3">Primary Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                required
                className="w-full px-0 py-4 bg-transparent border-b border-[#e5e5e5] text-[#1a1a1a] focus:border-[#c9a962] focus:outline-none transition-colors font-light"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.2em] font-bold uppercase text-[#1a1a1a] mb-3">Security Key</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                required
                minLength={6}
                className="w-full px-0 py-4 bg-transparent border-b border-[#e5e5e5] text-[#1a1a1a] focus:border-[#c9a962] focus:outline-none transition-colors font-light"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-[10px] tracking-[0.4em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors duration-500 disabled:opacity-50"
            >
              {loading ? "Initializing..." : "Establish Registry"}
            </button>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-[#f4f4f5]">
            <p className="text-[#a1a1aa] text-xs">
              Already registered?{" "}
              <Link href="/login" className="text-[#1a1a1a] font-bold hover:text-[#c9a962] transition-colors ml-2 uppercase tracking-widest text-[9px]">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
