"use client";

import { useState } from "react";

type LoginMode = "surfer" | "wandelaar" | "beheerder";

interface LoginFormProps {
  onGuestLogin: () => void;
  onCredentialLogin: (email: string, password: string, mode: LoginMode) => void;
  isLoading: boolean;
  error?: string;
}

export default function LoginForm({
  onGuestLogin,
  onCredentialLogin,
  isLoading,
  error,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleCredentialLogin(mode: LoginMode) {
    if (!email.trim() || !password.trim()) return;
    onCredentialLogin(email, password, mode);
  }

  const hasCredentials = email.trim() !== "" && password.trim() !== "";

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      {/* Error message */}
      {error && (
        <div className="rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-3 text-sm text-red-100 text-center">
          {error}
        </div>
      )}

      {/* Email input */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-white/80 mb-1.5">
          E-mailadres
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="naam@voorbeeld.be"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        />
      </div>

      {/* Password input */}
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-white/80 mb-1.5">
          Wachtwoord
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        />
      </div>

      {/* Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onGuestLogin}
          disabled={isLoading}
          className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/25"
        >
          {isLoading ? "Even geduld..." : "Login als surfer"}
        </button>

        <button
          onClick={() => handleCredentialLogin("wandelaar")}
          disabled={isLoading || !hasCredentials}
          className={`w-full py-3.5 font-bold rounded-xl transition-all border ${
            hasCredentials
              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-emerald-600/25"
              : "bg-white/10 text-white/40 border-white/10 cursor-not-allowed"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Login als wandelaar
          {!hasCredentials && (
            <span className="block text-xs font-normal mt-0.5 opacity-60">
              Vul e-mail en wachtwoord in
            </span>
          )}
        </button>

        <button
          onClick={() => handleCredentialLogin("beheerder")}
          disabled={isLoading || !hasCredentials}
          className={`w-full py-3.5 font-bold rounded-xl transition-all border ${
            hasCredentials
              ? "bg-[#1b4332] hover:bg-[#14332a] text-white border-[#2d6a4f] hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#1b4332]/25"
              : "bg-white/10 text-white/40 border-white/10 cursor-not-allowed"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Login als beheerder
          {!hasCredentials && (
            <span className="block text-xs font-normal mt-0.5 opacity-60">
              Vul e-mail en wachtwoord in
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
