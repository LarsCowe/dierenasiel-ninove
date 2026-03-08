"use client";

import { useState, useCallback, useRef } from "react";
import { submitContactForm, type ContactFormState } from "@/lib/actions/contact";

type FormErrors = Record<string, string>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Naam is verplicht";
  }

  if (!values.email.trim()) {
    errors.email = "E-mailadres is verplicht";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Vul een geldig e-mailadres in";
  }

  if (!values.subject) {
    errors.subject = "Kies een onderwerp";
  }

  if (!values.message.trim()) {
    errors.message = "Bericht is verplicht";
  }

  return errors;
}

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverState, setServerState] = useState<ContactFormState>({ success: false });
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const errorCount = Object.keys(errors).length;

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const scrollToFirstError = useCallback((validationErrors: FormErrors) => {
    const firstErrorField = Object.keys(validationErrors)[0];
    if (!firstErrorField || !formRef.current) return;
    const el = formRef.current.querySelector(`[data-field-error="${firstErrorField}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const inputClassName = (field: string) =>
    `w-full px-4 py-3 border-2 rounded-lg font-body text-sm text-text bg-bg focus:outline-none transition-colors ${
      errors[field]
        ? "border-red-500 bg-red-50/40 focus:border-red-500"
        : "border-gray-200 focus:border-primary"
    }`;

  const labelClassName = (field: string) =>
    `block text-sm font-semibold mb-1.5 ${errors[field] ? "text-red-700" : ""}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const values = { name, email, phone, subject, message };
    const validationErrors = validateForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollToFirstError(validationErrors);
      return;
    }

    setErrors({});
    setPending(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("subject", subject);
      formData.append("message", message.trim());

      const result = await submitContactForm({ success: false }, formData);
      setServerState(result);
    } catch {
      setServerState({
        success: false,
        message: "Er ging iets mis bij het versturen. Probeer het opnieuw.",
      });
    } finally {
      setPending(false);
    }
  }

  if (serverState.success) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-heading text-xl font-bold text-primary-dark mb-2">
          Bericht verstuurd!
        </h3>
        <p className="text-text-light">
          {serverState.message}
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {errorCount > 0 && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium" role="alert">
          Er {errorCount === 1 ? "is" : "zijn"} {errorCount} {errorCount === 1 ? "veld" : "velden"} niet correct ingevuld
        </div>
      )}

      {serverState.message && !serverState.success && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm" role="alert">
          {serverState.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div data-field-error={errors.name ? "name" : undefined}>
          <label htmlFor="name" className={labelClassName("name")}>
            Naam *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
            }}
            placeholder="Je volledige naam"
            className={inputClassName("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "error-name" : undefined}
          />
          {errors.name && (
            <p id="error-name" className="text-red-500 text-xs mt-1" role="alert">
              {errors.name}
            </p>
          )}
        </div>
        <div data-field-error={errors.email ? "email" : undefined}>
          <label htmlFor="email" className={labelClassName("email")}>
            E-mail *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            placeholder="je@email.com"
            className={inputClassName("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "error-email" : undefined}
          />
          {errors.email && (
            <p id="error-email" className="text-red-500 text-xs mt-1" role="alert">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="phone" className={labelClassName("phone")}>
          Telefoon
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError("phone");
          }}
          placeholder="Optioneel"
          className={inputClassName("phone")}
        />
      </div>

      <div className="mb-4" data-field-error={errors.subject ? "subject" : undefined}>
        <label htmlFor="subject" className={labelClassName("subject")}>
          Onderwerp *
        </label>
        <select
          id="subject"
          name="subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            clearError("subject");
          }}
          className={inputClassName("subject")}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "error-subject" : undefined}
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
        {errors.subject && (
          <p id="error-subject" className="text-red-500 text-xs mt-1" role="alert">
            {errors.subject}
          </p>
        )}
      </div>

      <div className="mb-5" data-field-error={errors.message ? "message" : undefined}>
        <label htmlFor="message" className={labelClassName("message")}>
          Bericht *
        </label>
        <textarea
          id="message"
          name="message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            clearError("message");
          }}
          rows={5}
          placeholder="Schrijf hier je bericht..."
          className={`${inputClassName("message")} resize-y`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "error-message" : undefined}
        />
        {errors.message && (
          <p id="error-message" className="text-red-500 text-xs mt-1" role="alert">
            {errors.message}
          </p>
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
