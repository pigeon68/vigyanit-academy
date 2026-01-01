"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  hideAccept?: boolean;
}

export function TermsModal({ isOpen, onClose, onAccept, hideAccept = false }: TermsModalProps) {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Check if user has scrolled within 20px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 20) {
      setHasReadToBottom(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.documentElement.style.overflow = "";
      setHasReadToBottom(false);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1a1a1a]/80 backdrop-blur-sm touch-none"
          />
          
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col h-[80vh] max-h-[900px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-none p-8 border-b border-[#e5e5e5] flex justify-between items-center bg-white z-10">
                <div>
                  <h2 className="font-serif text-3xl text-[#1a1a1a]">Terms & Conditions</h2>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#a1a1aa] mt-1">Payment and Enrolment Policy</p>
                </div>
                <button 
                  onClick={onClose}
                  className="text-[#a1a1aa] hover:text-[#1a1a1a] transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 text-[#71717a] text-sm leading-relaxed overscroll-contain scroll-smooth touch-pan-y"
              >
              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Enrolment Fee</h3>
                <p>An enrolment fee is payable by all new students at the time of first enrolment. This enrolment fee is one-time and is strictly non-refundable under all circumstances.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Payment of Term Tuition Fee</h3>
                <p>Full payment for the term must be made before the specified deadline unless otherwise agreed in writing.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Refund Policy</h3>
                <p>No refund, replacement or credit will be provided for any reason, including but not limited to absence, midterm withdrawal from ViGyanIT Academy, change of teacher, lesson time or date, lesson duration, curriculum, student status or any other circumstances.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Trial Period</h3>
                <p>ViGyanIT Academy offers a complementary trial lesson period for students enrolling in a new subject, excluding multi-term enrolments. After attending the trial lesson, students need to pay the enrolment fee and full term tuition fee in case they decide to continue. No trial period is available for multi-term enrolments.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Multi-Term Enrolments</h3>
                <p>All multi-term enrolments are final. No refund, credit, replacement or transfer of funds is available for any reason once payment has been made.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Changes to Classes and Curriculum</h3>
                <p>ViGyanIT Academy reserves the right to amend the curriculum, class schedule, lesson duration, class format and assigned teacher at any time without prior notice.</p>
                <p className="mt-4">The Academy does not guarantee that lesson content will align with the pace, topic order, difficulty or curriculum taught at a student’s school.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Awards and Prizes</h3>
                <p>Awards, including cash prizes, may be presented at the beginning of each term to eligible top-performing students who are enrolled in the same course during the previous term. Eligibility criteria are determined by the Academy.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">One-to-one Sessions and Additional Fees</h3>
                <p>Enrolled students are entitled to one complementary one-to-one session with the teacher per term. Additional sessions would cost an additional fee. An additional fee may also apply for class transfers beyond three per term.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Learning Materials</h3>
                <p>Students may be provided with learning materials, including but not limited to lecture notes, homework booklets, quizzes and lesson recordings. Learning materials may be provided in physical, electronic or other formats and are supplied solely for the private and personal use of enrolled students. All learning materials are confidential. They must not be copied, reproduced, distributed, sold, shared, published or used for any other purpose without prior written consent from ViGyanIT Academy.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Student Conduct and Performance</h3>
                <p>Students are required to comply with the Student Policy at all times during their enrolment. Student performance and conduct will be monitored on an ongoing basis. ViGyanIT Academy reserves the right to restrict or suspend a student’s enrolment based on academic performance, conduct or policy compliance.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Communication and Online App</h3>
                <p>ViGyanIT Academy communicates with parents and guardians through the ViGyanIT Academy Parent Portal. This includes notifications relating to attendance, academic performance, quizzes and homework, and any changes to class format or schedule. By enrolling, parents and guardians agree to access the Parent Portal regularly.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Amendments to Terms and Conditions</h3>
                <p>ViGyanIT Academy may amend these Terms and Conditions from time to time. Students and parents will be notified of any changes and may decline the amended terms within 14 days of the updated version being made available online.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">No Liability for Academic Results</h3>
                <p>Parents, guardians and students acknowledge and agree that ViGyanIT Academy shall not be held liable, indemnified or responsible for any unsatisfactory academic performance, test results, examination outcomes or perceived lack of academic improvement. No claims, demands or actions may be made against ViGyanIT Academy arising from a student’s academic results in any academic setting.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#1a1a1a] uppercase tracking-widest text-xs mb-4">Interpretation</h3>
                <p>ViGyanIT Academy reserves the right to interpret and apply these Terms and Conditions.</p>
              </section>
              
              <div className="pt-8 text-center text-[10px] tracking-[0.2em] uppercase text-[#a1a1aa]">
                End of Terms and Conditions
              </div>
            </div>

              {!hideAccept && (
                <div className="p-8 border-t border-[#e5e5e5] bg-[#fafaf9] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <p className="text-[10px] text-[#71717a] uppercase tracking-widest">
                    {hasReadToBottom ? "You have reviewed all terms." : "Please scroll to the bottom to agree."}
                  </p>
                  <button
                    disabled={!hasReadToBottom}
                    onClick={onAccept}
                    className={`px-12 py-4 text-[10px] tracking-[0.4em] uppercase transition-all duration-500 ${
                      hasReadToBottom 
                        ? "bg-[#1a1a1a] text-white hover:bg-[#c9a962]" 
                        : "bg-[#e5e5e5] text-[#a1a1aa] cursor-not-allowed"
                    }`}
                  >
                    I Agree
                  </button>
                </div>
              )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
