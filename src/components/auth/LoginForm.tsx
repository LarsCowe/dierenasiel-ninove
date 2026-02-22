"use client";

import { useState } from "react";

interface LoginFormProps {
  onGuestLogin: () => void;
  isLoading: boolean;
}

export default function LoginForm({ onGuestLogin, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
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
          disabled
          className="w-full py-3.5 bg-white/10 text-white/40 font-bold rounded-xl cursor-not-allowed border border-white/10"
        >
          Login als wandelaar
          <span className="block text-xs font-normal mt-0.5 text-white/30">
            Binnenkort beschikbaar
          </span>
        </button>

        <button
          disabled
          className="w-full py-3.5 bg-white/10 text-white/40 font-bold rounded-xl cursor-not-allowed border border-white/10"
        >
          Login als beheerder
          <span className="block text-xs font-normal mt-0.5 text-white/30">
            Binnenkort beschikbaar
          </span>
        </button>
      </div>
    </div>
  );
}
