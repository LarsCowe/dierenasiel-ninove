"use client";

import { useActionState } from "react";
import { completeAnimalTodo, deleteAnimalTodo } from "@/lib/actions/animal-todos";
import { TODO_TYPE_LABELS, TODO_PRIORITY_LABELS } from "@/lib/constants";
import { daysUntil } from "@/lib/utils/date";
import type { AnimalTodo } from "@/types";

const PRIORITY_COLORS: Record<string, string> = {
  dringend: "bg-red-100 text-red-700",
  hoog: "bg-orange-100 text-orange-700",
  normaal: "bg-gray-100 text-gray-600",
  laag: "bg-blue-100 text-blue-700",
};

function deadlineLabel(dateStr: string): { text: string; color: string } {
  const days = daysUntil(dateStr);
  if (days <= 0) return { text: "Verlopen!", color: "text-red-600" };
  if (days <= 3) return { text: `${days}d`, color: "text-orange-600" };
  return { text: dateStr, color: "text-gray-500" };
}

interface TodoListProps {
  todos: AnimalTodo[];
}

export default function TodoList({ todos }: TodoListProps) {
  const openTodos = todos.filter((t) => !t.isCompleted);
  const completedTodos = todos.filter((t) => t.isCompleted);

  if (todos.length === 0) {
    return <p className="text-sm text-gray-500">Nog geen taken aangemaakt.</p>;
  }

  return (
    <div className="space-y-4">
      {openTodos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Openstaand ({openTodos.length})
          </h4>
          <div className="mt-2 space-y-2">
            {openTodos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}
      {completedTodos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Afgerond ({completedTodos.length})
          </h4>
          <div className="mt-2 space-y-2">
            {completedTodos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TodoRow({ todo }: { todo: AnimalTodo }) {
  const [completeState, completeAction, isCompleting] = useActionState(completeAnimalTodo, null);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteAnimalTodo, null);

  const typeLabel = TODO_TYPE_LABELS[todo.type as keyof typeof TODO_TYPE_LABELS] ?? todo.type;
  const priorityLabel = TODO_PRIORITY_LABELS[todo.priority as keyof typeof TODO_PRIORITY_LABELS] ?? todo.priority;
  const priorityColor = PRIORITY_COLORS[todo.priority] ?? PRIORITY_COLORS.normaal;

  const borderColor = todo.isCompleted ? "border-gray-200" : "border-amber-200";
  const bgColor = todo.isCompleted ? "bg-gray-50/50" : "bg-amber-50/50";

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} px-3 py-2.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor}`}>
              {priorityLabel}
            </span>
            <span className="text-xs font-medium text-gray-500">{typeLabel}</span>
          </div>
          <p className={`text-sm ${todo.isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
            {todo.description}
          </p>
          {todo.dueDate && !todo.isCompleted && (() => {
            const dl = deadlineLabel(todo.dueDate);
            return (
              <p className={`text-xs ${dl.color}`}>
                Deadline: {dl.text}
              </p>
            );
          })()}
          {todo.isCompleted && todo.completedAt && (
            <p className="text-xs text-gray-400">
              Afgerond op {new Date(todo.completedAt).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels" })}
            </p>
          )}
          {completeState && !completeState.success && (
            <p className="text-xs text-red-600">{completeState.error}</p>
          )}
          {deleteState && !deleteState.success && (
            <p className="text-xs text-red-600">{deleteState.error}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {!todo.isCompleted && (
            <form action={completeAction}>
              <input type="hidden" name="id" value={todo.id} />
              <button
                type="submit"
                disabled={isCompleting}
                className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isCompleting ? "..." : "Afronden"}
              </button>
            </form>
          )}
          <form action={deleteAction}>
            <input type="hidden" name="id" value={todo.id} />
            <button
              type="submit"
              disabled={isDeleting}
              className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {isDeleting ? "..." : "Verwijderen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
