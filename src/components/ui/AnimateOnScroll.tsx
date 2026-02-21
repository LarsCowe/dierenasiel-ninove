"use client";

import { useEffect, useRef, type ReactNode } from "react";

type AnimationType = "fade-in" | "fade-in-left" | "fade-in-right";

export default function AnimateOnScroll({
  children,
  animation = "fade-in",
  className = "",
}: {
  children: ReactNode;
  animation?: AnimationType;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${animation} ${className}`}>
      {children}
    </div>
  );
}
