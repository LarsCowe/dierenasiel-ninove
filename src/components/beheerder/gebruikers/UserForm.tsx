"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser, updateUser, resetUserPassword } from "@/lib/actions/users";
import { BACKOFFICE_ROLES } from "@/lib/constants";

const ROLE_LABELS: Record<string, string> = {
  beheerder: "Beheerder",
  medewerker: "Medewerker",
  dierenarts: "Dierenarts",
  adoptieconsulent: "Adoptieconsulent",
  "coördinator": "Coördinator",
};

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean | null;
}

interface Props {
  editUser: User | null;
  onClose: () => void;
}

export default function UserForm({ editUser, onClose }: Props) {
  const isEdit = !!editUser;
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateUser : createUser,
    null,
  );
  const [resetState, resetAction, resetPending] = useActionState(resetUserPassword, null);
  const formRef = useRef<HTMLFormElement>(null);
  const prevStateRef = useRef(state);

  const hasFieldError = (field: string): boolean =>
    !!(state && !state.success && state.fieldErrors?.[field]?.length);

  const inputClassName = (field: string): string => {
    const base = "w-full rounded-lg border px-3 py-2 text-sm focus:ring-1";
    if (hasFieldError(field)) {
      return `${base} border-red-500 focus:border-red-500 focus:ring-red-500`;
    }
    return `${base} border-gray-300 focus:border-emerald-500 focus:ring-emerald-500`;
  };

  const labelClassName = (field: string): string => {
    const base = "mb-1 block text-sm font-medium";
    return hasFieldError(field) ? `${base} text-red-600` : `${base} text-gray-700`;
  };

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onClose();
    }
  }, [state, onClose]);

  // Scroll to first error field when validation fails
  useEffect(() => {
    if (
      state &&
      !state.success &&
      state.fieldErrors &&
      state !== prevStateRef.current
    ) {
      const errorFields = Object.keys(state.fieldErrors);
      if (errorFields.length > 0) {
        const firstErrorField = errorFields[0];
        const fieldIdMap: Record<string, string> = {
          name: "user-name",
          email: "user-email",
          role: "user-role",
          password: "user-password",
        };
        const elementId = fieldIdMap[firstErrorField];
        if (elementId) {
          const element = document.getElementById(elementId);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
          element?.focus();
        }
      }
    }
    prevStateRef.current = state;
  }, [state]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#1b4332]">
        {isEdit ? "Gebruiker bewerken" : "Nieuwe gebruiker"}
      </h2>

      <form ref={formRef} action={formAction} noValidate className="space-y-4">
        {isEdit && <input type="hidden" name="id" value={editUser.id} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="user-name" className={labelClassName("name")}>
              Naam *
            </label>
            <input
              id="user-name"
              name="name"
              type="text"
              defaultValue={editUser?.name ?? ""}
              aria-invalid={hasFieldError("name") || undefined}
              className={inputClassName("name")}
            />
            {state && !state.success && state.fieldErrors?.name && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="user-email" className={labelClassName("email")}>
              E-mail *
            </label>
            <input
              id="user-email"
              name="email"
              type="email"
              defaultValue={editUser?.email ?? ""}
              aria-invalid={hasFieldError("email") || undefined}
              className={inputClassName("email")}
            />
            {state && !state.success && state.fieldErrors?.email && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email[0]}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="user-role" className={labelClassName("role")}>
              Rol *
            </label>
            <select
              id="user-role"
              name="role"
              defaultValue={editUser?.role ?? ""}
              aria-invalid={hasFieldError("role") || undefined}
              className={inputClassName("role")}
            >
              <option value="">Selecteer een rol...</option>
              {BACKOFFICE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] ?? role}
                </option>
              ))}
            </select>
            {state && !state.success && state.fieldErrors?.role && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.role[0]}</p>
            )}
          </div>

          {!isEdit && (
            <div>
              <label htmlFor="user-password" className={labelClassName("password")}>
                Wachtwoord *
              </label>
              <input
                id="user-password"
                name="password"
                type="password"
                aria-invalid={hasFieldError("password") || undefined}
                className={inputClassName("password")}
              />
              {state && !state.success && state.fieldErrors?.password && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password[0]}</p>
              )}
            </div>
          )}

          {isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="flex items-center gap-2 pt-2">
                <input type="hidden" name="isActive" value="false" />
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked={editUser.isActive ?? true}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Actief</span>
              </div>
            </div>
          )}
        </div>

        {state && !state.success && state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        {state?.success && state.message && (
          <p className="text-sm text-emerald-600">{state.message}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[#1b4332] px-5 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
          >
            {isPending ? "Opslaan..." : isEdit ? "Bijwerken" : "Aanmaken"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuleren
          </button>
        </div>
      </form>

      {/* Password reset section for edit mode */}
      {isEdit && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Wachtwoord resetten</h3>
          <form action={resetAction} noValidate className="mt-2 flex items-end gap-3">
            <input type="hidden" name="id" value={editUser.id} />
            <div className="flex-1">
              <label htmlFor="reset-password" className="mb-1 block text-xs font-medium text-gray-600">
                Nieuw wachtwoord
              </label>
              <input
                id="reset-password"
                name="password"
                type="password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={resetPending}
              className="rounded-md border border-amber-600 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              {resetPending ? "Resetten..." : "Reset"}
            </button>
          </form>
          {resetState && !resetState.success && resetState.error && (
            <p className="mt-1 text-xs text-red-600">{resetState.error}</p>
          )}
          {resetState?.success && (
            <p className="mt-1 text-xs text-emerald-600">{resetState.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
