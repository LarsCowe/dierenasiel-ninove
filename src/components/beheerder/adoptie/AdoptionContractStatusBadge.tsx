interface Props {
  status: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  draft: { label: "Concept", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  klaar_voor_handtekening: { label: "Klaar voor handtekening", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
  verzonden_voor_digitale_handtekening: { label: "Verzonden voor digitale handtekening", bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-300" },
  getekend: { label: "Getekend", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
  geannuleerd: { label: "Geannuleerd", bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
};

export default function AdoptionContractStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}
