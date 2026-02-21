"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactFormState } from "@/lib/actions/contact";

const initialState: ContactFormState = { success: false };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);

  if (state.success) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-heading text-xl font-bold text-primary-dark mb-2">
          Bericht verstuurd!
        </h3>
        <p className="text-text-light">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      {state.message && !state.success && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold mb-1.5">
            Naam *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Je volledige naam"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-body text-sm text-text bg-bg focus:outline-none focus:border-primary transition-colors"
          />
          {state.errors?.name && (
            <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
            E-mail *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="je@email.com"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-body text-sm text-text bg-bg focus:outline-none focus:border-primary transition-colors"
          />
          {state.errors?.email && (
            <p className="text-red-500 text-xs mt-1">{state.errors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
          Telefoon
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="Optioneel"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-body text-sm text-text bg-bg focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="subject" className="block text-sm font-semibold mb-1.5">
          Onderwerp *
        </label>
        <select
          id="subject"
          name="subject"
          required
          defaultValue=""
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-body text-sm text-text bg-bg focus:outline-none focus:border-primary transition-colors"
        >
          <option value="" disabled>
            Kies een onderwerp
          </option>
          <option value="adoptie">Vraag over adoptie</option>
          <option value="vrijwilliger">Vrijwilliger worden</option>
          <option value="donatie">Donatie / Steun</option>
          <option value="gevonden">Gevonden dier melden</option>
          <option value="afstaan">Dier afstaan</option>
          <option value="info">Algemene vraag</option>
        </select>
        {state.errors?.subject && (
          <p className="text-red-500 text-xs mt-1">{state.errors.subject[0]}</p>
        )}
      </div>

      <div className="mb-5">
        <label htmlFor="message" className="block text-sm font-semibold mb-1.5">
          Bericht *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Schrijf hier je bericht..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-body text-sm text-text bg-bg focus:outline-none focus:border-primary transition-colors resize-y"
        />
        {state.errors?.message && (
          <p className="text-red-500 text-xs mt-1">{state.errors.message[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 bg-accent text-white rounded-full font-bold text-center shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Versturen..." : "Verstuur bericht →"}
      </button>
    </form>
  );
}
