import Link from "next/link";
import LogoutButton from "@/components/layout/LogoutButton";
import { refreshSession } from "@/lib/auth/session";

export const metadata = {
  title: "Beheerder | Dierenasiel Ninove",
};

const SIDEBAR_ITEMS = [
  { href: "/beheerder", label: "Dashboard", icon: "📊" },
  { href: "/beheerder", label: "Dieren", icon: "🐾" },
  { href: "/beheerder", label: "Nieuws", icon: "📰" },
  { href: "/beheerder", label: "Berichten", icon: "✉️" },
  { href: "/beheerder", label: "Gebruikers", icon: "👥" },
];

export default async function BeheerderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sliding window: refresh session if < 1 hour remaining
  await refreshSession();
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col bg-[#1b4332] shadow-xl md:flex">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <span className="text-2xl">🐾</span>
          <div>
            <p className="font-heading text-sm font-bold text-white">
              Dierenasiel Ninove
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Beheerder
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {SIDEBAR_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom logout */}
        <div className="border-t border-white/10 p-4">
          <LogoutButton variant="sidebar" />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col md:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-[#1b4332]">
            Backoffice
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Beheerder</span>
            <div className="md:hidden">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
