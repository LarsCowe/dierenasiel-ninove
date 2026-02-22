"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "./LoginForm";
import { loginAsGuest, loginWithCredentials } from "@/lib/actions/auth";

type LoginMode = "surfer" | "wandelaar" | "beheerder";

export default function SplashLogin() {
  const [phase, setPhase] = useState<"splash" | "login">("splash");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("login");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  async function handleGuestLogin() {
    setIsLoading(true);
    setError(undefined);
    try {
      await loginAsGuest();
      router.push("/");
    } catch {
      setIsLoading(false);
    }
  }

  async function handleCredentialLogin(
    email: string,
    password: string,
    mode: LoginMode
  ) {
    setIsLoading(true);
    setError(undefined);
    try {
      const result = await loginWithCredentials(email, password);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Check role permission
      if (mode === "beheerder" && result.role !== "beheerder") {
        setError("Je hebt geen beheerdersrechten.");
        setIsLoading(false);
        return;
      }

      if (
        mode === "wandelaar" &&
        result.role !== "wandelaar" &&
        result.role !== "beheerder"
      ) {
        setError("Je hebt geen wandelaarstoegang.");
        setIsLoading(false);
        return;
      }

      // Redirect based on chosen mode
      const redirectMap: Record<LoginMode, string> = {
        surfer: "/",
        wandelaar: "/wandelaar",
        beheerder: "/beheerder",
      };
      router.push(redirectMap[mode]);
    } catch {
      setError("Er ging iets mis. Probeer opnieuw.");
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)",
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #e76f51, transparent)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #f4a261, transparent)" }}
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center w-full px-6">
        {/* Logo */}
        <div
          className={`flex flex-col items-center transition-all duration-1000 ease-out ${
            phase === "splash"
              ? "translate-y-0 opacity-100"
              : "-translate-y-8 opacity-100"
          }`}
          style={{
            animation: phase === "splash" ? "fadeInUp 1s ease-out" : undefined,
          }}
        >
          <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-5xl shadow-xl shadow-black/20 mb-5">
            🐾
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white text-center">
            Dierenasiel Ninove
          </h1>
          <p className="text-white/60 text-sm mt-2 font-medium tracking-wide uppercase">
            VZW
          </p>
        </div>

        {/* Login form - slides in after splash */}
        <div
          className={`w-full max-w-sm mt-10 transition-all duration-700 ease-out ${
            phase === "login"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8 pointer-events-none"
          }`}
        >
          <p className="text-white/70 text-center text-sm mb-6">
            Kies hoe je wil verder gaan
          </p>
          <LoginForm
            onGuestLogin={handleGuestLogin}
            onCredentialLogin={handleCredentialLogin}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
