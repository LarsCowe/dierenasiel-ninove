import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { getAllUsers } from "@/lib/queries/users";
import UserManager from "@/components/beheerder/gebruikers/UserManager";

export default async function GebruikersPage() {
  const permCheck = await requirePermission("user:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const users = await getAllUsers();

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
          Gebruikers
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Beheer gebruikersaccounts en rollen.
        </p>
      </div>

      <div className="mt-6">
        <UserManager users={users} />
      </div>
    </div>
  );
}
