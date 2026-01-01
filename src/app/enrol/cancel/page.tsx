"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="bg-[#fafaf9] min-h-screen flex items-center justify-center py-20 noise-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl px-6"
      >
        <div className="bg-white border border-[#e5e5e5] p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl text-[#1a1a1a] mb-4">
              Payment <span className="italic font-light text-red-400">Cancelled</span>
            </h1>
              <p className="text-[#71717a] text-sm max-w-md mx-auto">
                Your payment was cancelled and no charges were made. 
                Your enrolment information has been saved - you can complete payment at any time.
              </p>
            </div>
  
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/enrol"
                className="px-10 py-4 text-[10px] tracking-[0.3em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors"
              >
              Try Again
            </Link>
            <Link
              href="/"
              className="px-10 py-4 text-[10px] tracking-[0.3em] uppercase border border-[#e5e5e5] text-[#1a1a1a] hover:border-[#c9a962] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
