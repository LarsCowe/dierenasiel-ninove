import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getWalkerByUserId, getDogsAvailableForWalking, getWalksByWalkerId } from "@/lib/queries/walks";
import { getWalkDays } from "@/lib/queries/shelter-settings";
import WalkerNotApprovedMessage from "@/components/wandelaar/WalkerNotApprovedMessage";
import AvailableDogsGrid from "@/components/wandelaar/AvailableDogsGrid";
import MyWalksSection from "@/components/wandelaar/MyWalksSection";
import LogoutButton from "@/components/layout/LogoutButton";

export default async function WandelaarDashboard() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const walker = await getWalkerByUserId(session.userId);

  if (!walker || walker.status !== "approved") {
    return <WalkerNotApprovedMessage />;
  }

  const [dogs, walks, walkDays] = await Promise.all([
    getDogsAvailableForWalking(),
    getWalksByWalkerId(walker.id),
    getWalkDays(),
  ]);

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-[#1b4332]">
          Hallo, {walker.firstName}!
        </h1>
        <LogoutButton />
      </div>

      {/* Available dogs */}
      <section className="mt-6">
        <h2 className="mb-3 font-heading text-lg font-semibold text-[#1b4332]">
          Beschikbare honden
        </h2>
        <AvailableDogsGrid dogs={dogs} walkDays={walkDays} />
      </section>

      {/* My walks */}
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-[#1b4332]">
          Mijn wandelingen
        </h2>
        <MyWalksSection walks={walks} />
      </section>
    </div>
  );
}
