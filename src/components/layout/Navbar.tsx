"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/97 backdrop-blur-md shadow-sm py-2.5"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link
          href="/"
          className={`flex items-center gap-3 font-heading text-xl font-bold transition-colors ${
            scrolled ? "text-primary-dark" : "text-white"
          }`}
        >
          <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center text-xl shrink-0">
            🐾
          </div>
          <span>Dierenasiel Ninove</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                scrolled
                  ? "text-text hover:bg-gray-100 hover:text-primary"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/honden-ter-adoptie"
            className="px-5 py-2.5 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent/90 transition-all hover:-translate-y-0.5"
          >
            Adopteer nu
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden flex flex-col gap-1.5 p-2 z-[1001]"
          aria-label="Menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-6 h-0.5 rounded transition-all ${
                mobileOpen
                  ? "bg-white"
                  : scrolled
                  ? "bg-text"
                  : "bg-white"
              }`}
            />
          ))}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-primary-dark/98 backdrop-blur-md flex flex-col items-center justify-center gap-5 z-[999] lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="text-white text-xl font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-all"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/honden-ter-adoptie"
            onClick={() => setMobileOpen(false)}
            className="mt-4 px-8 py-3 bg-accent text-white rounded-full text-lg font-bold hover:bg-accent/90 transition-all"
          >
            Adopteer nu
          </Link>
        </div>
      )}
    </nav>
  );
}
