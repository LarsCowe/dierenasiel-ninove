"use client";

import { useState, useEffect } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-8 right-8 w-12 h-12 rounded-full bg-primary text-white border-none cursor-pointer text-xl flex items-center justify-center shadow-lg z-50 transition-all duration-300 hover:bg-accent hover:-translate-y-1 ${
        visible
          ? "opacity-100 visible translate-y-0"
          : "opacity-0 invisible translate-y-5"
      }`}
      aria-label="Terug naar boven"
    >
      ↑
    </button>
  );
}
