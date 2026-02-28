import Link from "next/link";
import LogoutButton from "@/components/layout/LogoutButton";
import MobileSidebar from "./MobileSidebar";
import type { NavItem } from "@/lib/navigation";

interface HeaderProps {
  userName: string;
  userRole: string;
  navItems: NavItem[];
}

export default function Header({ userName, userRole, navItems }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <MobileSidebar items={navItems} />
        <h2 className="font-heading text-lg font-bold text-[#1b4332]">
          Backoffice
        </h2>
        <Link
          href="/beheerder/voortgang"
          className="hidden rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 transition-colors hover:bg-amber-100 md:inline-block"
        >
          Story 5.7 in ontwikkeling
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-sm font-medium text-gray-700">{userName}</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            {userRole}
          </span>
        </div>
        <div className="xl:hidden">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
