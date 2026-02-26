import { db } from "@/lib/db";
import { animalTodos, animals } from "@/lib/db/schema";
import { eq, and, asc, count, sql } from "drizzle-orm";
import type { AnimalTodo } from "@/types";

const priorityOrder = sql`CASE ${animalTodos.priority}
  WHEN 'dringend' THEN 1
  WHEN 'hoog' THEN 2
  WHEN 'normaal' THEN 3
  WHEN 'laag' THEN 4
  ELSE 5 END`;

export interface DashboardTodo {
  todo: {
    id: number;
    type: string;
    description: string;
    dueDate: string | null;
    priority: string;
    animalId: number;
  };
  animal: {
    id: number;
    name: string;
    species: string;
    imageUrl: string | null;
  };
}

export async function getTodosByAnimalId(animalId: number): Promise<AnimalTodo[]> {
  try {
    return await db
      .select()
      .from(animalTodos)
      .where(eq(animalTodos.animalId, animalId))
      .orderBy(
        asc(animalTodos.isCompleted),
        asc(priorityOrder),
        asc(animalTodos.dueDate),
      ) as AnimalTodo[];
  } catch (err) {
    console.error("getTodosByAnimalId query failed:", err);
    return [];
  }
}

export async function getOpenTodosForDashboard(limit = 10): Promise<DashboardTodo[]> {
  try {
    return await db
      .select({
        todo: {
          id: animalTodos.id,
          type: animalTodos.type,
          description: animalTodos.description,
          dueDate: animalTodos.dueDate,
          priority: animalTodos.priority,
          animalId: animalTodos.animalId,
        },
        animal: {
          id: animals.id,
          name: animals.name,
          species: animals.species,
          imageUrl: animals.imageUrl,
        },
      })
      .from(animalTodos)
      .innerJoin(animals, eq(animalTodos.animalId, animals.id))
      .where(eq(animalTodos.isCompleted, false))
      .orderBy(asc(priorityOrder), asc(animalTodos.dueDate))
      .limit(limit) as DashboardTodo[];
  } catch (err) {
    console.error("getOpenTodosForDashboard query failed:", err);
    return [];
  }
}

export async function countOpenTodosByAnimalId(animalId: number): Promise<number> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(animalTodos)
      .where(
        and(
          eq(animalTodos.animalId, animalId),
          eq(animalTodos.isCompleted, false),
        ),
      );
    return (result as { count: number })?.count ?? 0;
  } catch (err) {
    console.error("countOpenTodosByAnimalId query failed:", err);
    return 0;
  }
}
