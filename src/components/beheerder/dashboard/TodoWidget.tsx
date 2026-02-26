import Link from "next/link";
import { getOpenTodosForDashboard } from "@/lib/queries/animal-todos";
import { TODO_TYPE_LABELS } from "@/lib/constants";

function daysUntil(dateStr: string): number {
  const deadline = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days <= 0) return "text-red-700 bg-red-100";
  if (days <= 3) return "text-orange-700 bg-orange-100";
  if (days <= 7) return "text-yellow-700 bg-yellow-100";
  return "text-gray-600 bg-gray-100";
}

const PRIORITY_BADGE: Record<string, string> = {
  dringend: "bg-red-100 text-red-700",
  hoog: "bg-orange-100 text-orange-700",
};

export default async function TodoWidget() {
  const todos = await getOpenTodosForDashboard(10);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">📋</span>
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">
          Openstaande Taken
        </h3>
        {todos.length > 0 && (
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {todos.length}
          </span>
        )}
      </div>

      {todos.length === 0 ? (
        <p className="mt-4 text-center text-sm text-gray-400">
          Geen openstaande taken
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {todos.map((row) => {
            const typeLabel = TODO_TYPE_LABELS[row.todo.type as keyof typeof TODO_TYPE_LABELS] ?? row.todo.type;
            const priorityBadge = PRIORITY_BADGE[row.todo.priority];

            return (
              <li key={row.todo.id}>
                <Link
                  href={`/beheerder/dieren/${row.todo.animalId}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-800">{row.animal.name}</span>
                    <span className="ml-1.5 text-gray-400">{typeLabel}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {priorityBadge && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityBadge}`}>
                        {row.todo.priority === "dringend" ? "Dringend" : "Hoog"}
                      </span>
                    )}
                    {row.todo.dueDate && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyColor(daysUntil(row.todo.dueDate))}`}>
                        {daysUntil(row.todo.dueDate) <= 0
                          ? "Verlopen!"
                          : daysUntil(row.todo.dueDate) === 1
                            ? "Morgen"
                            : `${daysUntil(row.todo.dueDate)}d`}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
