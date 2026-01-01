"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const mouseX = useSpring(0, { stiffness: 500, damping: 28 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 28 });

  const innerX = useSpring(0, { stiffness: 1000, damping: 40 });
  const innerY = useSpring(0, { stiffness: 1000, damping: 40 });

    const [showSystemCursor, setShowSystemCursor] = useState(false);
    const [highContrast, setHighContrast] = useState(false);

    useEffect(() => {
      setMounted(true);
      
      // Detect mobile devices
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
        return hasTouch() || isMobileDevice;
      };
      
      setIsMobile(detectMobile());
      
      const checkStatus = () => {
        setShowSystemCursor(document.documentElement.classList.contains("show-cursor"));
        setHighContrast(document.documentElement.classList.contains("high-contrast"));
      };

      checkStatus();
      const observer = new MutationObserver(checkStatus);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });


      const handleMouseMove = (e: MouseEvent) => {

      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      innerX.set(e.clientX);
      innerY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.closest("a") ||
        target.getAttribute("role") === "button" ||
        target.classList.contains("cursor-pointer") ||
        target.classList.contains("cursor-expand") ||
        target.closest(".cursor-expand")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

    if (!mounted || showSystemCursor || isMobile) return null;

    return (
      <>
        <style jsx global>{`
          * {
            cursor: none !important;
          }
          a, button, [role="button"], .cursor-pointer {
            cursor: none !important;
          }
        `}</style>
        <motion.div
          className="fixed top-0 left-0 w-8 h-8 border-2 border-[#c9a962] rounded-full pointer-events-none z-[999999] mix-blend-normal"
          style={{
            x: mouseX,
            y: mouseY,
            translateX: "-50%",
            translateY: "-50%",
          }}
          animate={{
            scale: isClicking ? 0.8 : isHovering ? 1.5 : 1,
            backgroundColor: isHovering ? "rgba(201, 169, 98, 0.4)" : "transparent",
            borderColor: highContrast ? "#ffff00" : "#c9a962",
          }}
        />
        <motion.div
          className="fixed top-0 left-0 w-2 h-2 bg-[#c9a962] rounded-full pointer-events-none z-[999999] mix-blend-normal"
          style={{
            x: innerX,
            y: innerY,
            translateX: "-50%",
            translateY: "-50%",
          }}
          animate={{
            backgroundColor: highContrast ? "#ffff00" : "#c9a962",
          }}
        />
      </>
    );
}
