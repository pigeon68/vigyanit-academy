"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const AtomScene = dynamic(
  () => import("@/components/AtomScene").then((mod) => mod.AtomScene),
  { ssr: false }
);

// Mathematics curriculum data
const mathCurriculum = {
  "Year 7 Mathematics": {
    "Term 1": ["Computation with Integers", "Fractions, Decimals and Percentages"],
    "Term 2": ["Fractions, Decimals and Percentages (continued)", "Algebraic Techniques", "Indices"],
    "Term 3": ["Angle Relationships", "Equations"],
    "Term 4": ["Length", "Properties of Geometrical Figures", "Probability"],
  },
  "Year 8 Mathematics": {
    "Term 1": ["Algebraic Techniques", "Indices", "Linear Relationships"],
    "Term 2": ["Equations", "Rates and Ratios"],
    "Term 3": ["Area", "Volume", "Data Classification and Visualisation"],
    "Term 4": ["Data Analysis", "Right Angled Triangles (Pythagoras' Theorem)", "Financial Mathematics"],
  },
  "Year 9 Mathematics": {
    "Term 1": ["Indices A, B and C", "Algebraic Techniques A and B", "Equations A and B"],
    "Term 2": ["Linear Relationships A, B and C", "Financial Mathematics A", "Data Analysis A and B"],
    "Term 3": ["Area and Surface Area A", "Volume A", "Probability A and B"],
    "Term 4": ["Numbers of Any Magnitude", "Trigonometry A", "Variation and Rates of Change A and B"],
  },
  "Year 10 Mathematics": {
    "Term 1": ["Algebraic Techniques C", "Area and Surface Area B", "Volume B"],
    "Term 2": ["Financial Mathematics B", "Non-linear Relationships A and B and C", "Equations C"],
    "Term 3": ["Trigonometry B, C and D", "Introduction to Networks", "Properties of Geometrical Figures A, B and C"],
    "Term 4": ["Polynomials", "Logarithms", "Functions and Other Graphs", "Circle Geometry", "Data Analysis C"],
  },
  "Year 11 Advanced Mathematics": {
    "Term 4 (Year 10)": ["Polynomials", "Logarithms", "Functions and Other Graphs", "Circle Geometry", "Data Analysis C"],
    "Term 1": ["Functions", "Trigonometric Functions"],
    "Term 2": ["Trigonometric Functions (Continued)", "Calculus (Differentiation)"],
    "Term 3": ["Probability", "Exponential and Logarithmic Functions", "Past Preliminary Papers"],
  },
  "Year 12 Advanced Mathematics": {
    "Term 4 (Year 11)": ["Functions", "Trigonometric Functions", "Calculus (Differentiation)"],
    "Term 1": ["Further Differentiation", "Calculus (Integration)"],
    "Term 2": ["Statistical Analysis", "Random Variables", "Financial Mathematics"],
    "Term 3": ["Financial Mathematics (Continued)", "Past Papers"],
  },
  "Year 11 Extension Mathematics": {
    "Term 4 (Year 10)": ["Polynomials", "Logarithms", "Functions and Other Graphs", "Circle Geometry", "Data Analysis C"],
    "Term 1": ["Polynomials", "Functions"],
    "Term 2": ["Trigonometric Functions", "Combinatorics (Permutations and Combinations)"],
    "Term 3": ["Calculus (Differentiation)", "Past Preliminary Papers"],
  },
  "Year 12 Extension 1 Mathematics": {
    "Term 4 (Year 11)": ["Proofs (Induction)", "Vectors", "Trigonometric Functions"],
    "Term 1": ["Trigonometric Functions (Continued)", "Statistical Analysis", "Calculus (Differentiation and Integration)"],
    "Term 2": ["Calculus (Differentiation and Integration) (Continued)", "Further Vectors (Projectile Motion)"],
    "Term 3": ["Further Vectors (Projectile Motion) (Continued)", "Past Papers"],
  },
  "Year 12 Extension 2 Mathematics": {
    "Term 4 (Year 11)": ["Complex Numbers", "Proofs (Induction)"],
    "Term 1": ["Calculus (Differentiation and Integration)", "Vectors"],
    "Term 2": ["Mechanics"],
    "Term 3": ["Mechanics (Continued)", "Past Papers"],
  },
  "Year 11 Standard Mathematics": {
    "Term 4 (Year 10)": ["Algebraic Techniques", "Indices", "Area and Volume", "Financial Mathematics", "Right Angled Trigonometry", "Scientific Figures and Scientific Notation"],
    "Term 1": ["Algebra", "Earning and Managing Money", "Perimeter, Area and Volume"],
    "Term 2": ["Classifying and Representing Data", "Time", "Linear Relationships"],
    "Term 3": ["Statistical Analysis", "Probability", "Interest, Depreciation, Loans and Household Expenses", "Past Preliminary Papers"],
  },
  "Year 12 Standard 1 Mathematics": {
    "Term 4 (Year 11)": ["Right-Angled Triangles", "Depreciation and Loans"],
    "Term 1": ["Networks", "Scale Drawings", "Graphs of Practical Situations"],
    "Term 2": ["Simultaneous Linear Equations", "Investments", "Rates"],
    "Term 3": ["Statistical Analysis", "Past Papers"],
  },
  "Year 12 Standard 2 Mathematics": {
    "Term 4 (Year 11)": ["Annuities", "Non-right Angled Trigonometry"],
    "Term 1": ["Non-Linear Relationships", "Networks", "Bivariate Data Analysis"],
    "Term 2": ["Simultaneous Linear Equations", "Deprecation and Loans", "Rates and Ratios"],
    "Term 3": ["Normal Distribution", "Past Papers"],
  }
};

// Sciences curriculum data
const sciencesCurriculum = {
  "Year 7": {
    "Term 1": ["Investigations and working scientifically", "States of Matter and Properties"],
    "Term 2": ["Energy and water resources", "Mixtures"],
    "Term 3": ["Ecosystems and food chains", "Classification Systems"],
    "Term 4": ["Forces, Friction and Gravity", "Earth and the Solar System"],
  },
  "Year 8": {
    "Term 1": ["Data analysis", "Cells: Building blocks of life"],
    "Term 2": ["Digestion and Respiration", "Reproduction"],
    "Term 3": ["Types of energy", "Compounds and Mixtures"],
    "Term 4": ["Physical and Chemical Changes", "Mineral Resources"],
  },
  "Year 9": {
    "Term 1": ["Types of materials", "Types of reactions"],
    "Term 2": ["Heat, sound and light", "Electromagnetic radiation and visible spectrum", "Electricity"],
    "Term 3": ["Body systems", "Types of diseases"],
    "Term 4": ["Ecosystems", "Plate Tectonics"],
  },
  "Year 10": {
    "Term 1": ["Biological Sciences (Evolution, Genetics)"],
    "Term 2": ["Chemical Sciences (Periodic Table, Chemical Reacitons)"],
    "Term 3": ["Physical Sciences (Motion, speed, Laws of motion, Energy)"],
    "Term 4": ["Environmental Sciences (Weather, climate, Ecosystems, Universe)"],
  },
  "Y11 Chemistry": {
    "Term 4 (Year 10)": ["Module 1: Properties and structure of matter"],
    "Term 1": ["Module 2: Introduction to quantitative chemistry"],
    "Term 2": ["Module 3: Reactive chemistry"],
    "Term 3": ["Module 4: Drivers of reactions"],
  },
  "Year 12 Chemistry": {
    "Term 4 (Year 11)": ["Module 5: Equilibrium and reaction"],
    "Term 1": ["Module 6: Acid/base reactions"],
    "Term 2": ["Module 7: Organic chemistry"],
    "Term 3": ["Module 8: Applying Chemical Ideas"],
  },
  "Y11 Physics": {
    "Term 4 (Year 10)": ["Module 1: Kinematics"],
    "Term 1": ["Module 2: Dynamics"],
    "Term 2": ["Module 3: Waves and Thermodynamics"],
    "Term 3": ["Module 4: Electricity and Magnetism"],
  },
  "Year 12 Physics": {
    "Term 4 (Year 11)": ["Module 5: Advanced mechanics"],
    "Term 1": ["Module 6: Electromagnetism"],
    "Term 2": ["Module 7: The nature of light"],
    "Term 3": ["Module 8: From the universe to the atom"],
  },
  "Y11 Biology": {
    "Term 4 (Year 10)": ["Module 1: Cells as the basis of life"],
    "Term 1": ["Module 2: Organisation of living things"],
    "Term 2": ["Module 3: Biological Diversity"],
    "Term 3": ["Module 4: Ecosystem dynamics"],
  },
  "Year 12 Biology": {
    "Term 4 (Year 11)": ["Module 5: Heredity"],
    "Term 1": ["Module 6: Genetic Change"],
    "Term 2": ["Module 7: Infectious Disease"],
    "Term 3": ["Module 8: Non-infectious Disease and Disorders"],
  },
};

function CurriculumCard({ year, terms, index }: { year: string; terms: Record<string, string[]>; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-[#e5e5e5] hover:border-[#c9a962]/30 transition-all duration-500 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-8 lg:p-10 flex items-center justify-between group text-left"
      >
        <div>
          <h3 className="font-serif text-3xl lg:text-4xl text-[#1a1a1a] group-hover:text-[#c9a962] transition-colors duration-500">
            {year}
          </h3>
        </div>
        <div className={`w-12 h-12 flex items-center justify-center border border-[#e5e5e5] group-hover:border-[#c9a962] transition-all duration-500 ${isExpanded ? 'bg-[#c9a962] border-[#c9a962]' : ''}`}>
          <svg 
            className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-white' : 'text-[#c9a962]'}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-8 lg:px-10 pb-10 border-t border-[#f4f4f5]">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#a1a1aa] mt-8 font-medium">
                 Comprehensive Curriculum Structure
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mt-4">
                {Object.entries(terms).map(([term, topics]) => (
                  <div key={term} className="pt-8">
                    <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#c9a962] font-bold mb-6">{term}</h4>
                    <ul className="space-y-4">
                      {topics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-1 h-1 rounded-full bg-[#c9a962] mt-2 flex-shrink-0" />
                          <span className="text-[#71717a] text-sm font-light leading-relaxed">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MethodSection() {
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
    <section className="py-32 lg:py-56 bg-white border-y border-[#e5e5e5]">
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
              Our Methodology
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-7xl text-[#1a1a1a] leading-tight mb-8">
              The <span className="italic font-light">ViGyanIT</span> <br /> Advantage
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
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

export default function ProgramsPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>("mathematics");
  const curriculumRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (curriculumRef.current) {
      curriculumRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSubject]);

  const handleSubjectChange = (id: string) => {
    if (selectedSubject === id) {
      curriculumRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setSelectedSubject(id);
    }
  };

    const subjects = [
      { id: "mathematics", name: "Mathematics", available: true },
      { id: "sciences", name: "Sciences", available: true },
      { id: "english", name: "English", available: true },
      { id: "it", name: "Information Tech", available: true },
    ];


  return (
    <main className="bg-[#fafaf9] min-h-screen">
      <Navigation />

      <section className="relative pt-40 lg:pt-56 pb-20 lg:pb-32 overflow-hidden">
        <AtomScene />
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl"
          >
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#c9a962] font-bold block mb-8">
              Academic Curriculae
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-8xl text-[#1a1a1a] leading-[0.9] mb-8 sm:mb-10">
              Grade-by-Grade <br />
              <span className="italic font-light text-[#c9a962]">Mastery</span>
            </h1>
            <p className="text-[#71717a] text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl font-light">
              Explore our meticulously architected pathways designed to transform 
              potential into profound understanding across every discipline.
            </p>
          </motion.div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#e5e5e5] to-transparent" />
      </section>

      <section className="sticky top-20 z-40 bg-[#fafaf9]/80 backdrop-blur-xl border-b border-[#e5e5e5]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="flex gap-10 overflow-x-auto no-scrollbar py-6">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSubjectChange(s.id)}
                className={`group relative text-[10px] tracking-[0.3em] font-bold uppercase transition-colors duration-300 whitespace-nowrap ${

                  selectedSubject === s.id ? 'text-[#1a1a1a]' : 'text-[#a1a1aa] hover:text-[#1a1a1a]'
                }`}
              >
                {s.name}
                {selectedSubject === s.id && (
                  <motion.div layoutId="underline" className="absolute -bottom-6 left-0 right-0 h-0.5 bg-[#c9a962]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section ref={curriculumRef} className="py-24 lg:py-40 scroll-mt-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {selectedSubject === 'mathematics' ? (
            <div className="space-y-6 lg:space-y-8">
              {Object.entries(mathCurriculum).map(([year, terms], index) => (
                <CurriculumCard key={year} year={year} terms={terms} index={index} />
              ))}
            </div>
          ) : selectedSubject === 'sciences' ? (
            <div className="space-y-6 lg:space-y-8">
              {Object.entries(sciencesCurriculum).map(([year, terms], index) => (
                <CurriculumCard key={year} year={year} terms={terms} index={index} />
              ))}
            </div>
          ) : (
             <div className="py-40 text-center">
                <span className="text-[10px] tracking-[0.4em] uppercase text-[#c9a962] block mb-6">Coming Soon</span>
                <p className="text-[#71717a] font-light italic">Detailed curriculum for {subjects.find(s => s.id === selectedSubject)?.name} is currently being architected.</p>
             </div>
          )}
        </div>
      </section>

      <MethodSection />

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
            <h2 className="font-serif text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-[#1a1a1a] leading-none mb-10 sm:mb-12">
              Ready to <br />
              <span className="italic font-light text-[#c9a962]">Achieve?</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/enrol"
                className="px-8 sm:px-14 py-4 sm:py-6 text-xs tracking-[0.4em] uppercase bg-[#1a1a1a] text-[#fafaf9] hover:bg-[#c9a962] transition-colors duration-500 shadow-xl"
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
