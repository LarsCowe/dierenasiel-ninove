"use client";

import { useState } from "react";
import TodoList from "./TodoList";
import TodoForm from "./TodoForm";
import type { AnimalTodo } from "@/types";

interface TodoSectionProps {
  animalId: number;
  todos: AnimalTodo[];
}

export default function TodoSection({ animalId, todos }: TodoSectionProps) {
  const [view, setView] = useState<"list" | "form">("list");

  const openCount = todos.filter((t) => !t.isCompleted).length;
  const completedCount = todos.filter((t) => t.isCompleted).length;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
            view === "list"
              ? "bg-[#1b4332] text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Overzicht ({openCount} open / {completedCount} afgerond)
        </button>
        <button
          type="button"
          onClick={() => setView("form")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
            view === "form"
              ? "bg-[#1b4332] text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Nieuwe taak
        </button>
      </div>

      {view === "list" ? (
        <TodoList todos={todos} />
      ) : (
        <TodoForm animalId={animalId} onCancel={() => setView("list")} />
      )}
    </div>
  );
}
