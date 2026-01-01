"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { submitInquiry } from "./actions";

const CrystalScene = dynamic(
  () => import("@/components/CrystalScene").then((mod) => mod.CrystalScene),
  { ssr: false }
);

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("email", formData.email);
    fd.append("phone", formData.phone);
    fd.append("message", formData.message);

    const result = await submitInquiry(fd);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  const inputClasses = (field: string) =>
    `w-full bg-transparent border-b ${
      focusedField === field ? "border-[#c9a962]" : "border-[#e5e5e5]"
    } py-5 text-[#1a1a1a] placeholder-transparent focus:outline-none transition-colors duration-500 font-light`;

  const labelClasses = (field: string, value: string) =>
    `absolute left-0 transition-all duration-500 pointer-events-none ${
      focusedField === field || value
        ? "top-0 text-[10px] tracking-[0.2em] uppercase text-[#c9a962] font-bold"
        : "top-5 text-[#a1a1aa] font-light"
    }`;

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-24 bg-white border border-[#e5e5e5] p-12"
      >
        <div className="w-24 h-24 mx-auto mb-10 border border-[#c9a962] rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-[#c9a962]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-serif text-4xl text-[#1a1a1a] mb-6">Message Sent</h3>
        <p className="text-[#71717a] mb-12 max-w-sm mx-auto font-light leading-relaxed">
          Thank you for reaching out. A member of our team will contact 
          you within 24 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-[10px] tracking-[0.3em] uppercase text-[#1a1a1a] font-bold border-b border-[#1a1a1a] pb-1 hover:text-[#c9a962] hover:border-[#c9a962] transition-all"
        >
          Send Another Message
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 bg-white p-10 lg:p-16 border border-[#e5e5e5] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.05)]">
      {error && (
        <div className="p-4 bg-red-50 border-l-2 border-red-500 text-red-600 text-xs font-medium">
          {error}
        </div>
      )}
      <div className="relative">
        <label className={labelClasses("name", formData.name)}>Full Name</label>
        <input
          type="text"
          required
          className={inputClasses("name")}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onFocus={() => setFocusedField("name")}
          onBlur={() => setFocusedField(null)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="relative">
          <label className={labelClasses("email", formData.email)}>Email Address</label>
          <input
            type="email"
            required
            className={inputClasses("email")}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        <div className="relative">
          <label className={labelClasses("phone", formData.phone)}>Phone Number</label>
          <input
            type="tel"
            className={inputClasses("phone")}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField(null)}
          />
        </div>
      </div>

      <div className="relative">
        <label className={labelClasses("message", formData.message)}>Your Message</label>
        <textarea
          rows={4}
          required
          className={`${inputClasses("message")} resize-none`}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          onFocus={() => setFocusedField("message")}
          onBlur={() => setFocusedField(null)}
        />
      </div>

      <div className="pt-6">
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full lg:w-auto px-16 py-6 text-[10px] tracking-[0.4em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors duration-500 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Message"}
        </motion.button>
      </div>
    </form>
  );
}

function ContactInfo() {
  return (
    <div className="space-y-16 lg:pl-12">
      <div>
        <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#c9a962] font-bold mb-6">Inquiries</h3>
        <p className="text-[#1a1a1a] font-serif text-2xl leading-snug">
          office@vigyanitacademy.com<br />
          +61476149277
        </p>
      </div>

      <div>
        <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#c9a962] font-bold mb-6">Operating Hours</h3>
        <ul className="space-y-3 text-[#71717a] font-light">
          <li className="flex justify-between"><span>Mon — Fri</span> <span>09:00 — 20:00</span></li>
          <li className="flex justify-between"><span>Saturday</span> <span>10:00 — 18:00</span></li>
          <li className="flex justify-between"><span>Sunday</span> <span>By Appointment</span></li>
        </ul>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <main className="bg-[#fafaf9] min-h-screen">
      <Navigation />

      <section className="relative pt-40 lg:pt-56 pb-32 lg:pb-48 overflow-hidden">
        <CrystalScene />
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mb-24"
          >
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#c9a962] font-bold block mb-8">
              Contact Us
            </span>
            <h1 className="font-serif text-6xl lg:text-8xl xl:text-9xl text-[#1a1a1a] leading-[0.9] mb-10">
              Get in <br />
              <span className="italic font-light text-[#c9a962]">Touch</span>
            </h1>
            <p className="text-[#71717a] text-xl lg:text-2xl leading-relaxed max-w-2xl font-light">
              Have questions about our programs or admissions? Reach out to our 
              dedicated team for personalized guidance.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="lg:col-span-7"
            >
              <ContactForm />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="lg:col-span-5"
            >
              <ContactInfo />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
