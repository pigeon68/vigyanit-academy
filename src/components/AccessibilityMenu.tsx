"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Type, Contrast, MousePointer2, Type as FontIcon } from "lucide-react";

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [showCursor, setShowCursor] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device has no mousepad (mobile/tablet)
    const detectMobile = () => {
      const hasTouch = () => {
        return (
          typeof window !== 'undefined' &&
          (navigator.maxTouchPoints > 0 ||
            ('ontouchstart' in window))
        );
      };
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      );
      return (hasTouch() || isMobileDevice) && window.matchMedia('(max-width: 1024px)').matches;
    };
    
    setIsMobile(detectMobile());
    
    // Load from localStorage
    const saved = localStorage.getItem("accessibility-settings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setHighContrast(settings.highContrast ?? false);
        setDyslexicFont(settings.dyslexicFont ?? false);
        setFontSize(settings.fontSize ?? "normal");
        // Only load showCursor if not on mobile
        if (!detectMobile()) {
          setShowCursor(settings.showCursor ?? false);
        }
      } catch (e) {
        console.error("Failed to parse accessibility settings", e);
      }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    if (dyslexicFont) {
      body.classList.add("dyslexic-font");
    } else {
      body.classList.remove("dyslexic-font");
    }

    root.classList.remove("font-size-large", "font-size-xlarge");
    if (fontSize === "large") root.classList.add("font-size-large");
    if (fontSize === "xlarge") root.classList.add("font-size-xlarge");

    if (showCursor) {
      root.classList.add("show-cursor");
    } else {
      root.classList.remove("show-cursor");
    }

    // Save to localStorage
    localStorage.setItem("accessibility-settings", JSON.stringify({
      highContrast,
      dyslexicFont,
      fontSize,
      showCursor
    }));
  }, [highContrast, dyslexicFont, fontSize, showCursor]);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="fixed z-[9999] pointer-events-none inset-x-0 inset-y-0 flex items-end justify-end p-4 sm:p-6" style={{ pointerEvents: 'none' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto mb-4 p-4 sm:p-6 bg-white border border-[#e5e5e5] shadow-2xl w-[calc(100vw-2rem)] sm:w-[320px] sm:min-w-[320px] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] rounded-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#1a1a1a]">
                Accessibility Options
              </h3>
              <button
                onClick={toggleMenu}
                className="text-[#a1a1aa] hover:text-[#1a1a1a] transition-colors"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full flex items-center justify-between p-3 border transition-all duration-300 ${
                  highContrast ? "border-[#c9a962] bg-[#c9a962]/5" : "border-[#e5e5e5] hover:border-[#c9a962]/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Contrast size={14} className={highContrast ? "text-[#c9a962]" : "text-[#71717a]"} />
                  <span className="text-[11px] uppercase tracking-wider font-medium">High Contrast</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${highContrast ? "bg-[#c9a962]" : "bg-[#e5e5e5]"}`} />
              </button>

              <button
                onClick={() => setDyslexicFont(!dyslexicFont)}
                className={`w-full flex items-center justify-between p-3 border transition-all duration-300 ${
                  dyslexicFont ? "border-[#c9a962] bg-[#c9a962]/5" : "border-[#e5e5e5] hover:border-[#c9a962]/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FontIcon size={14} className={dyslexicFont ? "text-[#c9a962]" : "text-[#71717a]"} />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Dyslexic Font</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${dyslexicFont ? "bg-[#c9a962]" : "bg-[#e5e5e5]"}`} />
              </button>

              <div className="p-3 border border-[#e5e5e5]">
                <div className="flex items-center gap-3 mb-3">
                  <Type size={14} className="text-[#71717a]" />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Font Size</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["normal", "large", "xlarge"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`py-2 text-[9px] uppercase tracking-widest border transition-all duration-300 ${
                        fontSize === size ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-[#71717a] border-[#e5e5e5] hover:border-[#c9a962]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {!isMobile && (
                <button
                  onClick={() => setShowCursor(!showCursor)}
                  className={`w-full flex items-center justify-between p-3 border transition-all duration-300 ${
                    showCursor ? "border-[#c9a962] bg-[#c9a962]/5" : "border-[#e5e5e5] hover:border-[#c9a962]/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MousePointer2 size={14} className={showCursor ? "text-[#c9a962]" : "text-[#71717a]"} />
                    <span className="text-[11px] uppercase tracking-wider font-medium">Standard Cursor</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${showCursor ? "bg-[#c9a962]" : "bg-[#e5e5e5]"}`} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleMenu}
        className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 bg-[#1a1a1a] text-white flex items-center justify-center shadow-2xl hover:bg-[#c9a962] transition-colors duration-500 rounded-sm"
        aria-label="Accessibility menu"
      >
        <Settings size={24} />
      </motion.button>
    </div>
  );
}
