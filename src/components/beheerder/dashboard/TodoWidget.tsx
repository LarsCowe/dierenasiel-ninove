export default function TodoWidget() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">📋</span>
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">
          Openstaande Taken
        </h3>
      </div>
      <p className="mt-4 text-center text-sm text-gray-400">
        Geen openstaande taken
      </p>
    </div>
  );
}
