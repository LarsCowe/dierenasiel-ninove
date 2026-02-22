import LogoutButton from "@/components/layout/LogoutButton";

export default function WandelaarDashboard() {
  return (
    <div className="flex flex-col items-center px-6 pt-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#2d6a4f] text-4xl shadow-lg">
        🐕
      </div>
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Welkom, wandelaar!
      </h1>
      <p className="mt-3 max-w-md text-[#2d6a4f]/80">
        Dit platform wordt binnenkort beschikbaar. Hier kan je je wandelingen
        plannen, beschikbare honden bekijken en je wandelgeschiedenis raadplegen.
      </p>
      <div className="mt-8 rounded-xl border border-[#d1fae5] bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-[#2d6a4f]">
          Functies in ontwikkeling:
        </p>
        <ul className="mt-3 space-y-2 text-left text-sm text-[#2d6a4f]/70">
          <li className="flex items-center gap-2">
            <span>📅</span> Wandelingen plannen
          </li>
          <li className="flex items-center gap-2">
            <span>🐾</span> Beschikbare honden bekijken
          </li>
          <li className="flex items-center gap-2">
            <span>📊</span> Wandelgeschiedenis
          </li>
          <li className="flex items-center gap-2">
            <span>📋</span> Wandelreglement
          </li>
        </ul>
      </div>
      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
