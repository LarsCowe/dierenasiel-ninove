import { getDashboardStats } from "@/lib/queries/dashboard";
import StatsCards from "@/components/beheerder/dashboard/StatsCards";
import AlertWidget from "@/components/beheerder/dashboard/AlertWidget";
import TodoWidget from "@/components/beheerder/dashboard/TodoWidget";
import DeadlineWidget from "@/components/beheerder/dashboard/DeadlineWidget";
import RecentAdoptions from "@/components/beheerder/dashboard/RecentAdoptions";
import StatusOverview from "@/components/beheerder/dashboard/StatusOverview";

export default async function BeheerderDashboard() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Overzicht van het dierenasiel.
      </p>

      <div className="mt-6">
        <StatsCards stats={stats} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <StatusOverview statuses={stats.animalsByStatus} />
        <RecentAdoptions adoptions={stats.recentAdoptions} />
        <AlertWidget />
        <DeadlineWidget />
        <TodoWidget />
      </div>
    </div>
  );
}
