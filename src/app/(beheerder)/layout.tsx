import { refreshSession, getSession } from "@/lib/auth/session";
import { getVisibleNavItems } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { isTrekkerOfAnyEvent } from "@/lib/queries/events";
import Sidebar from "@/components/beheerder/Sidebar";
import Header from "@/components/beheerder/Header";

export const metadata = {
  title: "Beheerder | Dierenasiel Ninove",
};

export default async function BeheerderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await refreshSession();
  const session = await getSession();

  const role = session?.role ?? "";
  const name = session?.name ?? "Gebruiker";
  // Story 13.14 — wie geen evenementenrecht heeft maar er wel één trekt, ziet het
  // menu toch. Enkel dan een query: de beheerder ziet het menu sowieso.
  const trekker =
    session && !hasPermission(role, "event:read") ? await isTrekkerOfAnyEvent(session.userId) : false;
  const navItems = getVisibleNavItems(role, { trekker });

  return (
    <div className="flex min-h-screen bg-[#eef2f7]">
      <Sidebar items={navItems} />

      <div className="flex flex-1 flex-col xl:ml-60">
        <Header userName={name} userRole={role} navItems={navItems} />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
