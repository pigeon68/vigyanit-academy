"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function SuccessContent() {
  const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const method = searchParams.get("method");
    const [amount, setAmount] = useState<string | null>(searchParams.get("amount"));
    const studentId = searchParams.get("studentId");
    const supabase = createClient();

    const isBankTransfer = method === 'bank_transfer';

    useEffect(() => {
      if (isBankTransfer && !amount && studentId) {
        async function fetchStudentAmount() {
          const { data, error } = await supabase
            .from('students')
            .select('grade_level')
            .eq('profile_id', studentId)
            .single();
          
          if (data && !error) {
            const calculatedAmount = data.grade_level >= 11 ? "750" : "450";
            setAmount(calculatedAmount);
          }
        }
        fetchStudentAmount();
      }
    }, [isBankTransfer, amount, studentId, supabase]);

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
            <div className="w-20 h-20 mx-auto bg-[#c9a962]/10 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-[#c9a962]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
              <h1 className="font-serif text-4xl lg:text-5xl text-[#1a1a1a] mb-4">
                {isBankTransfer ? "Enrolment " : "Enrolment "}
                <span className="italic font-light text-[#c9a962]">{isBankTransfer ? "Submitted" : "Complete"}</span>
              </h1>
              <p className="text-[#71717a] text-sm max-w-md mx-auto">
                {isBankTransfer 
                  ? "Your enrolment has been received. Please complete your bank transfer to activate your account."
                  : "Thank you for enrolling. Your payment has been processed successfully. You will receive a confirmation email shortly."}
              </p>
            </div>

          {isBankTransfer && (
            <div className="bg-[#fafaf9] border border-[#c9a962]/30 p-8 mb-10 text-left">
              <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#c9a962] mb-6">Bank Transfer Instructions</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-[#e5e5e5] pb-3">
                  <span className="text-xs text-[#a1a1aa] uppercase tracking-wider">Account Name</span>
                  <span className="text-sm font-medium text-[#1a1a1a]">VIGYANIT ACADEMY PTY LTD</span>
                </div>
                <div className="flex justify-between border-b border-[#e5e5e5] pb-3">
                  <span className="text-xs text-[#a1a1aa] uppercase tracking-wider">BSB</span>
                  <span className="text-sm font-medium text-[#1a1a1a]">062703</span>
                </div>
                <div className="flex justify-between border-b border-[#e5e5e5] pb-3">
                  <span className="text-xs text-[#a1a1aa] uppercase tracking-wider">Account Number</span>
                  <span className="text-sm font-medium text-[#1a1a1a]">10862095</span>
                </div>
                <div className="flex justify-between border-b border-[#e5e5e5] pb-3">
                  <span className="text-xs text-[#a1a1aa] uppercase tracking-wider">Amount</span>
                  <span className="text-sm font-bold text-[#c9a962]">{amount ? `$${amount}.00` : "Please check your email"}</span>
                </div>
                  <p className="text-[10px] text-[#71717a] mt-4 leading-relaxed italic">
                    * Important: Please include the Student Name as the payment reference. Your enrolment will be confirmed once the funds appear in our account (usually 1-2 business days).
                  </p>
              </div>
            </div>
          )}

          <div className="border-t border-[#e5e5e5] pt-8 mt-8">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#a1a1aa] mb-6">
              What happens next?
            </p>
            <div className="space-y-4 text-left max-w-sm mx-auto">
              <div className="flex items-start gap-4">
                <span className="text-[#c9a962] font-bold">1.</span>
                <p className="text-sm text-[#71717a]">
                  {isBankTransfer ? "Complete the bank transfer using the details above" : "Check your email for login credentials"}
                </p>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-[#c9a962] font-bold">2.</span>
                <p className="text-sm text-[#71717a]">
                  {isBankTransfer ? "We will verify your payment within 48 hours" : "Log in to the parent portal to view your student's schedule"}
                </p>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-[#c9a962] font-bold">3.</span>
                <p className="text-sm text-[#71717a]">
                  {isBankTransfer ? "You will receive an activation email once confirmed" : "Attend the first class at the scheduled time"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-10 py-4 text-[10px] tracking-[0.3em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors"
            >
              Go to Login
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

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="bg-[#fafaf9] min-h-screen flex items-center justify-center">
        <p className="text-[#71717a]">Loading...</p>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
