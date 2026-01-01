"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "./actions";

function BookSpine3D() {
  return (
    <div className="absolute inset-0 flex items-center justify-center perspective-[1000px] opacity-20">
      <div className="relative w-full h-full">
        {[...Array(12)].map((_, i) => {
          const delay = i * 0.1;
          const rotation = (i - 5.5) * 8;
          return (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ rotateY: 0, z: -500 }}
              animate={{
                rotateY: [0, rotation, rotation],
                z: [-500, 0, 0],
                x: [(i - 5.5) * 20, (i - 5.5) * 50, (i - 5.5) * 50],
              }}
              transition={{
                duration: 2,
                delay,
                ease: "easeOut",
              }}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="w-16 h-72 bg-gradient-to-b from-[#c9a962] via-[#d4b872] to-[#8b7355] rounded-sm shadow-2xl"
              >
                <div className="h-full w-full bg-gradient-to-r from-white/20 via-transparent to-white/20" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#fafaf9] min-h-screen flex items-center justify-center overflow-hidden relative noise-overlay">
      <BookSpine3D />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-white border border-[#e5e5e5] p-10 lg:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)]">
          <div className="mb-12 text-center">
            <Link href="/" className="inline-block mb-10 group">
              <span className="text-[10px] tracking-[0.4em] uppercase text-[#a1a1aa] group-hover:text-[#c9a962] transition-colors">
                ← Return Home
              </span>
            </Link>
            <h1 className="font-serif text-5xl text-[#1a1a1a] mb-4">
              Welcome <span className="italic font-light text-[#c9a962]">Back</span>
            </h1>
            <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase font-medium">
              Access Your Academy Portal
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-2 border-red-500 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a] font-bold mb-3">
                  Account Email or Student ID
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-0 py-4 bg-transparent border-b border-[#e5e5e5] text-[#1a1a1a] focus:border-[#c9a962] focus:outline-none transition-colors font-light"
                  placeholder="email@example.com or STU123456"
                />
              </div>

            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a] font-bold mb-3">
                Security Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-0 py-4 bg-transparent border-b border-[#e5e5e5] text-[#1a1a1a] focus:border-[#c9a962] focus:outline-none transition-colors font-light"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-[10px] tracking-[0.4em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors duration-500 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Enter Portal"}
            </button>
          </form>

            <div className="mt-12 text-center pt-8 border-t border-[#f4f4f5]">
              <p className="text-[#a1a1aa] text-xs">
                First time?{" "}
                  <Link href="/enrol" className="text-[#1a1a1a] font-bold hover:text-[#c9a962] transition-colors ml-2 uppercase tracking-widest text-[9px]">
                  Apply for Enrolment
                </Link>
              </p>
            </div>
        </div>
      </motion.div>
    </main>
  );
}
