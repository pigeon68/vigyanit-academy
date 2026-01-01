"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { TermsModal } from "@/components/TermsModal";

export function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const socialLinks = [
    {
      name: "Facebook",
      href: "#",
      path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    },
    {
      name: "Twitter",
      href: "#",
      path: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
    },
    {
      name: "LinkedIn",
      href: "#",
      path: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
    }
  ];

  return (
    <footer className="bg-[#fafaf9] border-t border-[#e5e5e5]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3 mb-8">
              <div className="w-64 h-24 relative">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-[#71717a] text-sm leading-relaxed max-w-md mb-8">
              A sanctuary for intellectual growth where exceptional minds are 
              cultivated through bespoke academic guidance and transformative 
              learning experiences.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 flex items-center justify-center border border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#fafaf9] transition-all duration-300"
                  aria-label={social.name}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 lg:col-start-7">
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a] font-bold mb-6">
              Navigation
            </h4>
              <ul className="space-y-4">
                {["Programs", "About", "Results", "Trial-Lesson"].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/${item.toLowerCase()}`}
                      className="text-sm text-[#71717a] hover:text-[#c9a962] transition-colors duration-300"
                    >
                      {item === "Trial-Lesson" ? "Trial Lesson" : item}
                    </Link>
                  </li>
                ))}
              </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a] font-bold mb-6">
              Programs
            </h4>
            <ul className="space-y-3">
              {["Mathematics", "Sciences", "Exam Prep"].map((item) => (
                <li key={item}>
                  <Link
                    href="/programs"
                    className="text-sm text-[#71717a] hover:text-[#c9a962] transition-colors duration-300"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

            <div className="lg:col-span-3">
              <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a] font-bold mb-6">
                Contact
              </h4>
                <ul className="space-y-4 text-sm text-[#71717a]">
                  <li>office@vigyanitacademy.com</li>
                  <li>+61476149277</li>
                </ul>
            </div>
        </div>

        <div className="mt-20 pt-8 border-t border-[#e5e5e5] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase">
            © {new Date().getFullYear()} Vigyanit Academy. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <button
              onClick={() => setIsTermsOpen(true)}
              className="text-[#a1a1aa] text-[10px] tracking-widest uppercase hover:text-[#1a1a1a] transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
      <TermsModal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
        hideAccept={true}
      />
    </footer>
  );
}
