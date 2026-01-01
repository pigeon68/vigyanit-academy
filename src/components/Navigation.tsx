"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname?.startsWith("/portal")) return null;

    const navLinks = [
      { href: "/programs", label: "Programs" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact Us" },
      { href: "/trial-lesson", label: "Trial Lesson" },
      { href: "/login", label: "Login" },
    ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            isScrolled
              ? "bg-[#fafaf9]/80 backdrop-blur-xl border-b border-[#e5e5e5]/50"
              : "bg-transparent"
          }`}
        >
          <nav className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between h-20 lg:h-24">
                  <Link href="/" className="group flex items-center gap-3">
                    <div className="w-64 h-24 relative">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </Link>

                <div className="hidden lg:flex items-center gap-12">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs tracking-[0.3em] uppercase text-[#71717a] hover:text-[#c9a962] transition-colors duration-300 font-medium"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="hidden lg:flex items-center gap-6">
                  <Link
                    href="/enrol"
                    className="px-8 py-3 text-xs tracking-[0.2em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-all duration-500 shadow-sm"
                  >
                    Enrol Now
                  </Link>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#c9a962] rounded-sm"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMobileMenuOpen}
                >
                <span
                  className={`w-6 h-px bg-[#1a1a1a] transition-all duration-300 ${
                    isMobileMenuOpen ? "rotate-45 translate-y-1" : ""
                  }`}
                />
                <span
                  className={`w-6 h-px bg-[#1a1a1a] transition-all duration-300 ${
                    isMobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`w-6 h-px bg-[#1a1a1a] transition-all duration-300 ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </button>
            </div>
          </nav>
        </motion.header>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-[#fafaf9] lg:hidden"
            >
              <motion.nav
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col items-center justify-center h-full gap-8"
              >
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-serif text-4xl text-[#1a1a1a] hover:text-[#c9a962] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="mt-8"
                  >
                    <Link
                      href="/enrol"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-10 py-4 text-xs tracking-[0.2em] uppercase bg-[#1a1a1a] text-[#fafaf9]"
                    >
                      Enrol Now
                    </Link>
                  </motion.div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );
}