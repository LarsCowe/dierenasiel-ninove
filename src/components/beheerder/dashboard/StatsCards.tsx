import type { DashboardStats } from "@/lib/queries/dashboard";

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const honden = stats.animalsBySpecies.find((s) => s.species === "hond")?.count ?? 0;
  const katten = stats.animalsBySpecies.find((s) => s.species === "kat")?.count ?? 0;
  const andere = stats.totalAnimals - honden - katten;

  const cards = [
    { label: "Totaal dieren", value: stats.totalAnimals, icon: "🐾" },
    { label: "Honden", value: honden, icon: "🐕" },
    { label: "Katten", value: katten, icon: "🐈" },
    { label: "Andere", value: Math.max(0, andere), icon: "🐇" },
    { label: "Ongelezen berichten", value: stats.unreadMessages, icon: "✉️" },
    { label: "Actieve gebruikers", value: stats.activeUsers, icon: "👥" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {card.label}
            </p>
            <span className="text-xl">{card.icon}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1b4332]">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
