interface Adoption {
  id: number;
  name: string;
  species: string;
  adoptedDate: string | null;
}

interface RecentAdoptionsProps {
  adoptions: Adoption[];
}

export default function RecentAdoptions({ adoptions }: RecentAdoptionsProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">🏠</span>
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">
          Recente Adopties
        </h3>
      </div>
      {adoptions.length === 0 ? (
        <p className="mt-4 text-center text-sm text-gray-400">
          Nog geen adopties geregistreerd
        </p>
      ) : (
        <div className="mt-4 divide-y divide-gray-50">
          {adoptions.map((adoption) => (
            <div key={adoption.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {adoption.species === "hond" ? "🐕" : adoption.species === "kat" ? "🐈" : "🐾"}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {adoption.name}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {adoption.adoptedDate
                  ? new Date(adoption.adoptedDate).toLocaleDateString("nl-BE")
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
