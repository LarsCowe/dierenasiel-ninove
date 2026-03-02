import { refreshSession, getSession } from "@/lib/auth/session";
import { getVisibleNavItems } from "@/lib/navigation";
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
  const navItems = getVisibleNavItems(role);

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
