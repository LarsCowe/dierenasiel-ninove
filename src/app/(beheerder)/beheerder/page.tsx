export default function BeheerderDashboard() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Dashboard
      </h1>
      <p className="mt-2 text-gray-500">
        Welkom beheerder, dit platform wordt binnenkort beschikbaar.
      </p>

      {/* Placeholder stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Dieren", value: "—", icon: "🐾" },
          { label: "Adoptie-aanvragen", value: "—", icon: "📋" },
          { label: "Berichten", value: "—", icon: "✉️" },
          { label: "Gebruikers", value: "—", icon: "👥" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#1b4332]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-600">
          Functies in ontwikkeling:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-gray-500">
          <li className="flex items-center gap-2">
            <span>🐾</span> Dierenbeheer (toevoegen, bewerken, status)
          </li>
          <li className="flex items-center gap-2">
            <span>📰</span> Nieuwsartikelen beheren
          </li>
          <li className="flex items-center gap-2">
            <span>✉️</span> Contactberichten inzien
          </li>
          <li className="flex items-center gap-2">
            <span>👥</span> Gebruikersbeheer
          </li>
        </ul>
      </div>
    </div>
  );
}
