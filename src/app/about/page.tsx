"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const BookScene = dynamic(
  () => import("@/components/BookScene").then((mod) => mod.BookScene),
  { ssr: false }
);

function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section ref={ref} className="relative pt-40 lg:pt-56 pb-20 lg:pb-32 overflow-hidden bg-[#fafaf9]">
      <BookScene />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fafaf9]" />
        <motion.div
          style={{ y }}
          className="absolute inset-0 flex items-center justify-center opacity-[0.03]"
        >
          <svg viewBox="0 0 400 400" className="w-[1000px] h-[1000px]">
            <circle cx="200" cy="200" r="180" stroke="#c9a962" strokeWidth="1" fill="none" />
            <line x1="200" y1="20" x2="200" y2="380" stroke="#c9a962" strokeWidth="0.5" />
            <line x1="20" y1="200" x2="380" y2="200" stroke="#c9a962" strokeWidth="0.5" />
          </svg>
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#c9a962] font-bold block mb-8">
              The Mission
            </span>
              <h1 className="font-serif text-6xl lg:text-8xl xl:text-9xl text-[#1a1a1a] leading-[0.9] mb-10">
                Cultivating <br />
                <span className="italic font-light text-[#c9a962]">Exceptional Minds</span>
              </h1>
              <p className="text-[#71717a] text-xl lg:text-2xl leading-relaxed max-w-2xl font-light">
                We are not merely a tuition centre, but an academic institution dedicated to the refinement of thought and the pursuit of mastery.
              </p>
        </motion.div>
      </div>
    </section>
  );
}

function FoundingStory() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <section ref={ref} className="py-32 lg:py-56 bg-white border-t border-[#e5e5e5]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-24 lg:gap-40 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#71717a] font-bold block mb-8">
              Legacy of Excellence
            </span>
            <h2 className="font-serif text-5xl lg:text-7xl text-[#1a1a1a] leading-tight mb-10">
              A Vision Born from <br />
              <span className="italic font-light text-[#c9a962]">Passion</span>
            </h2>
            <div className="space-y-8 text-[#71717a] text-lg lg:text-xl font-light leading-relaxed">
              <p>
                Our founders observed a gap in traditional pedagogy—a lack of 
                mentorship that truly honored the individual's intellectual trajectory.
              </p>
              <p>
                They envisioned a sanctuary where methodology aligns with psychology, 
                where results are a byproduct of profound understanding rather than 
                performance pressure.
              </p>
            </div>
          </motion.div>

          <motion.div style={{ y }} className="relative">
            <div className="aspect-square relative p-12 lg:p-20 bg-[#fafaf9] border border-[#e5e5e5]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a962]/5" />
               <div className="space-y-12">
                  <div className="w-20 h-20 border border-[#c9a962]/30 flex items-center justify-center">
                    <div className="w-10 h-10 border border-[#c9a962]" />
                  </div>
                  <blockquote className="font-serif text-3xl italic text-[#1a1a1a] leading-relaxed">
                    "True wisdom is not the inheritance of many, but the earned prize of a dedicated few."
                  </blockquote>
                  <cite className="block text-[10px] tracking-[0.4em] uppercase text-[#a1a1aa] font-medium not-italic">
                    — The Academy Principles
                  </cite>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ValuesSection() {
  const values = [
    {
      title: "Intellectual Rigor",
      description: "Maintaining the absolute benchmark of academic standard through critical inquiry.",
    },
    {
      title: "Individualised Focus",
      description: "Crafting bespoke educational schemas that honour unique cognitive signatures.",
    },
    {
      title: "Ethical Integrity",
      description: "Developing character and emotional intelligence alongside academic capability.",
    },
    {
      title: "Bespoke Mentorship",
      description: "Fostering long-term growth through direct access to specialised expertise.",
    },
  ];

  return (
    <section className="py-32 lg:py-56 bg-[#fafaf9]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-32"
        >
          <span className="text-[10px] tracking-[0.4em] uppercase text-[#c9a962] font-bold block mb-8">
            The Core
          </span>
          <h2 className="font-serif text-5xl lg:text-8xl text-[#1a1a1a]">
            Our <span className="italic font-light">Foundations</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-[#e5e5e5] border border-[#e5e5e5] overflow-hidden">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className="bg-[#fafaf9] p-12 lg:p-20 hover:bg-white transition-colors duration-500 group"
            >
              <span className="text-[10px] text-[#a1a1aa] mb-12 block font-medium tracking-widest">0{i + 1}</span>
              <h3 className="font-serif text-3xl lg:text-4xl text-[#1a1a1a] mb-6 group-hover:text-[#c9a962] transition-colors duration-500">{v.title}</h3>
              <p className="text-[#71717a] text-lg font-light leading-relaxed max-w-sm">{v.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="bg-[#fafaf9] min-h-screen">
      <Navigation />
      <HeroSection />
      <FoundingStory />
      <ValuesSection />
      
      <section className="py-40 lg:py-64 relative bg-[#fafaf9] overflow-hidden border-t border-[#e5e5e5]">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-[#e5e5e5]/30 rounded-full" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#e5e5e5]/50 rounded-full" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#e5e5e5] rounded-full" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-serif text-6xl md:text-8xl lg:text-9xl text-[#1a1a1a] leading-none mb-12">
              Ready to <br />
              <span className="italic font-light text-[#c9a962]">Achieve?</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/enrol"
                className="px-14 py-6 text-xs tracking-[0.4em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors duration-500 shadow-xl"
              >
                Enrol Now
              </Link>
              <Link
                href="/trial-lesson"
                className="px-14 py-6 text-xs tracking-[0.4em] uppercase border border-[#e5e5e5] text-[#1a1a1a] hover:bg-white hover:border-[#c9a962] transition-all duration-500"
              >
                Book a Trial Lesson
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
