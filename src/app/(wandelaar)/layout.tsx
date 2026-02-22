import Link from "next/link";

export const metadata = {
  title: "Wandelaar | Dierenasiel Ninove",
};

const NAV_ITEMS = [
  { href: "/wandelaar", label: "Home", icon: "🏠" },
  { href: "/wandelaar", label: "Wandelingen", icon: "🐕" },
  { href: "/wandelaar", label: "Profiel", icon: "👤" },
];

export default function WandelaarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f0fdf4]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#1b4332] px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐾</span>
          <span className="font-heading text-lg font-bold text-white">
            Dierenasiel Ninove
          </span>
        </div>
        <span className="rounded-full bg-[#2d6a4f] px-3 py-1 text-xs font-semibold text-emerald-200">
          Wandelaar
        </span>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d1fae5] bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-4 py-1 text-[#2d6a4f] transition-colors hover:text-[#1b4332]"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
