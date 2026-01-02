"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "./actions";
import { Mail, X } from "lucide-react";

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess(false);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data.error || "Failed to process request");
        setForgotLoading(false);
        return;
      }

      setForgotSuccess(true);
      setForgotIdentifier("");
      setForgotLoading(false);

      // Close modal after 3 seconds
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotSuccess(false);
      }, 3000);
    } catch (err) {
      setForgotError("An error occurred. Please try again.");
      setForgotLoading(false);
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
              <p className="text-[#a1a1aa] text-xs mb-6">
                First time?{" "}
                  <Link href="/enrol" className="text-[#1a1a1a] font-bold hover:text-[#c9a962] transition-colors ml-2 uppercase tracking-widest text-[9px]">
                  Apply for Enrolment
                </Link>
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setForgotError("");
                  setForgotSuccess(false);
                }}
                className="text-[#c9a962] hover:text-[#1a1a1a] text-xs font-medium tracking-widest uppercase transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <Mail size={14} />
                Forgot Password?
              </button>
            </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowForgotPassword(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#e5e5e5] rounded-lg max-w-md w-full p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif text-[#1a1a1a]">
                Reset <span className="italic font-light text-[#c9a962]">Password</span>
              </h2>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} className="text-[#a1a1aa]" />
              </button>
            </div>

            {forgotSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-green-600" />
                </div>
                <p className="text-[#1a1a1a] font-medium mb-2">Request Sent Successfully</p>
                <p className="text-xs text-[#a1a1aa]">
                  A password reset request has been sent to office@vigyanitacademy.com. Our team will contact you shortly to assist with your account recovery.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Enter your email address or student ID. Our team will process your password reset request and contact you to verify your identity.
                </p>

                {forgotError && (
                  <div className="p-3 bg-red-50 border-l-2 border-red-500 text-red-600 text-xs font-medium">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a] font-bold mb-3">
                    Email or Student ID
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    required
                    disabled={forgotLoading}
                    className="w-full px-0 py-4 bg-transparent border-b border-[#e5e5e5] text-[#1a1a1a] focus:border-[#c9a962] focus:outline-none transition-colors font-light disabled:opacity-50"
                    placeholder="email@example.com or STU123456"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || !forgotIdentifier}
                  className="w-full py-4 text-[10px] tracking-[0.4em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors duration-500 disabled:opacity-50 font-medium"
                >
                  {forgotLoading ? "Sending Request..." : "Send Reset Request"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-4 text-[10px] tracking-[0.4em] uppercase border border-[#e5e5e5] text-[#1a1a1a] hover:bg-gray-50 transition-colors duration-500 font-medium"
                >
                  Cancel
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
