"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { RevealParticles, FloatingParticles } from "@/components/RevealParticles";

const StudyScene = dynamic(
  () => import("@/components/StudyScene").then((mod) => mod.StudyScene),
  { ssr: false }
);

function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fafaf9] noise-overlay"
    >
      <StudyScene />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,250,249,0.8)_0%,transparent_80%)] z-[1] pointer-events-none" />
      <FloatingParticles count={12} className="z-[2]" />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mb-8"
        >
          <span className="text-xs tracking-[0.5em] uppercase text-[#c9a962] font-bold">
            Redefining Academic Potential
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="font-serif text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-[#1a1a1a] leading-[1] tracking-tight mb-10"
        >
          Your Gateway to 
          <br />
          <span className="italic font-light text-[#c9a962]">Smart Learning</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className="max-w-2xl mx-auto text-[#1a1a1a] text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed mb-10 sm:mb-16 font-medium"
        >
          A sanctuary for intellectual growth, where methodology meets mentorship to cultivate the next generation of visionaries.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-6 justify-center"
        >
          <Link
            href="/enrol"
            className="group relative px-6 sm:px-12 py-3 sm:py-5 text-xs tracking-[0.3em] uppercase bg-[#1a1a1a] text-[#fafaf9] overflow-hidden"
          >
            <span className="relative z-10 transition-colors duration-500 group-hover:text-[#fafaf9]">
              Begin Journey
            </span>
            <div className="absolute inset-0 bg-[#c9a962] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          </Link>
          <Link
            href="/programs"
            className="px-6 sm:px-12 py-3 sm:py-5 text-xs tracking-[0.3em] uppercase border border-[#e5e5e5] text-[#1a1a1a] hover:border-[#c9a962] hover:text-[#c9a962] transition-all duration-500"
          >
            Explore Programs
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "24/7", label: "Support" },
    { value: "15+", label: "Tutors" },
    { value: "2", label: "Physical Locations & Online LMS" }
  ];

  return (
    <RevealParticles particleCount={12}>
      <section className="py-24 lg:py-40 bg-[#fafaf9] border-y border-[#e5e5e5]/50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex justify-center">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24 text-center max-w-3xl">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col items-center"
              >
                <div className="font-serif text-5xl lg:text-7xl text-[#1a1a1a] mb-4 flex items-baseline justify-center gap-1 group-hover:text-[#c9a962] transition-colors duration-500 w-full">
                  {stat.value}
                </div>
                <div className="text-xs tracking-[0.3em] uppercase text-[#71717a] font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </RevealParticles>
  );
}

function ProgramsPreview() {
  const programs = [
    {
      number: "01",
      title: "Mathematics",
      description: "From foundational arithmetic to advanced calculus, developing analytical mastery.",
      subjects: ["Standard", "Advanced", "Extension", "Year 7-10"],
    },
    {
      number: "02",
      title: "Sciences",
      description: "Rigorous scientific inquiry across physics, chemistry, and biology disciplines.",
      subjects: ["Physics", "Chemistry", "Biology", "Year 7-10"],
    },
    {
      number: "03",
      title: "Information Tech",
      comingSoon: true,
      description: "Mastering software development, systems, and modern digital technologies.",
      subjects: ["Programming", "Web", "Data"],
    },
    {
      number: "04",
      title: "English",
      comingSoon: true,
      description: "Developing critical literacy, analytical writing, and appreciation for literature.",
      subjects: ["Standard", "Advanced", "Year 7-10"],
    },
  ];

  return (
    <RevealParticles particleCount={15} className="py-32 lg:py-56 bg-white">
      <section>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col items-center text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              <span className="text-xs tracking-[0.4em] uppercase text-[#c9a962] font-bold block mb-6">
                Academic Disciplines
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-7xl text-[#1a1a1a] leading-tight mb-8">
                Build Your <br />
                <span className="italic font-light">Academic Foundation</span>
              </h2>
              <p className="text-[#71717a] text-sm sm:text-base md:text-lg leading-relaxed font-light mx-auto">
                Bespoke programs designed for the intellectually curious, focused on foundational mastery and advanced inquiry.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 max-w-5xl mx-auto">
            {programs.map((program, index) => (
              <Link key={program.title} href="/programs">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative bg-[#c9a962] p-6 sm:p-10 lg:p-12 border border-white/20 hover:border-white/40 transition-all duration-700 text-center cursor-pointer"
                >
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-xs text-white/60 mb-8 block font-medium tracking-widest">{program.number}</span>
                  <h3 className="font-serif text-4xl sm:text-6xl lg:text-8xl text-white mb-4 transition-colors duration-500">
                    {program.title}
                  </h3>
                  {program.comingSoon && (
                    <div className="mb-6">
                      <span className="text-[10px] tracking-[0.3em] uppercase bg-white/20 text-white px-3 py-1 font-bold rounded-sm border border-white/30">
                        Coming Soon
                      </span>
                    </div>
                  )}
                  <p className="text-white/90 mb-8 sm:mb-10 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-sm">
                    {program.description}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {program.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-3 sm:px-6 py-1 sm:py-2 text-[10px] sm:text-xs tracking-[0.2em] uppercase border border-white/30 text-white hover:border-white transition-all duration-500"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </RevealParticles>
  );
}

function LearningExperienceSection() {
  const experiences = [
    {
      title: "Structured Theory Lessons",
      description: "Expert-led classes delivering content in structured 1-2 hour sessions.",
    },
    {
      title: "Varied Resources",
      description: "NSW curriculum-aligned resources with worked examples and practice questions.",
    },
    {
      title: "Weekly Homework & Feedback",
      description: "Homework is collected each week, marked by tutors, and returned with feedback to reinforce key concepts.",
    },
    {
      title: "Digital Learning Portal",
      description: "Online quizzes, video lessons, and extra practice for independent study.",
    },
    {
      title: "Small Class Sizes",
      description: "Small classes (capped at 6) to ensure individualised attention and support.",
    },
    {
      title: "1:1 Support Workshops",
      description: "Free one-on-one tutor support for conceptual understanding or homework assistance.",
    },
  ];

  return (
    <section className="py-32 lg:py-56 bg-[#fafaf9] border-y border-[#e5e5e5]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <span className="text-xs tracking-[0.4em] uppercase text-[#c9a962] font-bold block mb-6">
              The Learning Experience
            </span>
            <h2 className="font-serif text-5xl lg:text-7xl text-[#1a1a1a] leading-tight mb-8">
              A Structured <br />
              <span className="italic font-light">Approach to Learning</span>
            </h2>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              <div className="mb-8 flex items-center gap-6">
                <span className="text-xs text-[#c9a962] font-bold tracking-widest uppercase">0{index + 1}</span>
                <div className="h-[1px] flex-grow bg-[#e5e5e5] group-hover:bg-[#c9a962]/30 transition-colors duration-500" />
              </div>
              <h3 className="font-serif text-2xl lg:text-3xl text-[#1a1a1a] mb-6 group-hover:text-[#c9a962] transition-colors duration-500">
                {exp.title}
              </h3>
              <p className="text-[#71717a] text-lg font-light leading-relaxed">
                {exp.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhilosophySection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  return (
    <RevealParticles particleCount={15}>
      <section ref={ref} className="py-32 lg:py-64 relative overflow-hidden bg-[#fafaf9]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex flex-col items-center text-center gap-24 lg:gap-32">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl"
            >
              <span className="text-xs tracking-[0.4em] uppercase text-[#c9a962] font-bold block mb-8">
                Our Philosophy
              </span>
              <h2 className="font-serif text-5xl lg:text-8xl text-[#1a1a1a] leading-[1.1] mb-10">
                Learning That <br />
                <span className="italic font-light">Makes a Difference</span>
              </h2>
              <div className="space-y-8 text-[#71717a] text-lg lg:text-2xl font-light leading-relaxed">
                <p>
                  We believe that education is about more than just grades. It's about building confidence, 
                  critical thinking, and a lifelong love for learning.
                </p>
                <p>
                  Our teaching approach combines traditional methods with modern technology to create 
                  an environment where every student can succeed.
                </p>
              </div>
              <div className="mt-16">
                <Link
                  href="/about"
                  className="inline-flex flex-col items-center gap-6 group"
                >
                  <span className="text-xs tracking-[0.3em] uppercase text-[#1a1a1a] font-bold">About Us</span>
                  <div className="w-12 h-[1px] bg-[#1a1a1a] group-hover:w-20 group-hover:bg-[#c9a962] transition-all duration-500" />
                </Link>
              </div>
            </motion.div>

            <motion.div style={{ y }} className="relative w-full max-w-4xl">
              <div className="relative">
                <div className="absolute inset-0 border border-[#e5e5e5] -translate-x-4 translate-y-4" />
                <div className="relative bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] overflow-hidden p-8 sm:p-12 lg:p-16 xl:p-24 flex items-center justify-center text-center min-h-[400px] sm:min-h-[500px]">
                  <div className="space-y-8 sm:space-y-12">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto border border-[#c9a962]/30 rounded-full flex items-center justify-center">
                       <div className="w-12 h-12 sm:w-16 sm:h-16 border border-[#c9a962] rounded-full animate-[spin_20s_linear_infinite]" />
                    </div>
                    <blockquote className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl italic text-[#1a1a1a] leading-snug">
                      "The mind is not a vessel to be filled, but a fire to be kindled."
                    </blockquote>
                    <cite className="block text-xs tracking-[0.4em] uppercase text-[#a1a1aa] font-medium not-italic">
                      — Plutarch
                    </cite>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </RevealParticles>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "ViGyanIT transformed how I perceive challenges. It's not just tutoring; it's mentorship that builds genuine confidence.",
      role: "Class of 2025",
    },
    {
      quote: "The personalised attention here is unmatched. I transitioned from struggling in Physics to top of my class in months.",
      role: "Year 12 Student",
    },
    {
      quote: "Strategic, rigorous, and inspiring. The environment invites you to do your absolute best alongside brilliant peers.",
      role: "Year 11 Student",
    },
  ];

  return (
    <section className="py-32 lg:py-64 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-32"
        >
          <span className="text-xs tracking-[0.4em] uppercase text-[#c9a962] font-bold block mb-8">
            Testimonials
          </span>
          <h2 className="font-serif text-5xl lg:text-8xl text-[#1a1a1a]">
            What Our <span className="italic font-light text-[#c9a962]">Students Say</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-16 lg:gap-24 text-center">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center"
            >
              <div className="mb-10 text-[#c9a962]/20">
                <svg width="45" height="45" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              </div>
              <p className="text-xl lg:text-2xl text-[#1a1a1a] font-light leading-relaxed mb-10 italic font-serif">
                "{t.quote}"
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-[1px] bg-[#c9a962]" />
                <div className="text-center">
                  <div className="text-xs text-[#a1a1aa] uppercase tracking-[0.2em] mt-1">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-40 lg:py-64 relative bg-[#fafaf9] overflow-hidden">
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
  );
}

export default function HomePage() {
  return (
    <main className="bg-[#fafaf9] min-h-screen selection:bg-[#c9a962]/20">
      <Navigation />
      <HeroSection />
      <StatsSection />
      <ProgramsPreview />
      <LearningExperienceSection />
      <PhilosophySection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
