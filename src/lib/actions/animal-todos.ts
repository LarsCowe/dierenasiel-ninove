"use server";

import { db } from "@/lib/db";
import { animalTodos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAnimalTodoSchema, completeAnimalTodoSchema } from "@/lib/validations/animal-todos";
import { getSession } from "@/lib/auth/session";
import { getAnimalById } from "@/lib/queries/animals";
import { revalidatePath } from "next/cache";
import type { ActionResult, AnimalTodo } from "@/types";

function revalidateTodoPaths() {
  revalidatePath("/beheerder/dieren");
  revalidatePath("/beheerder/dieren/[id]", "page");
  revalidatePath("/beheerder");
}

export async function createAnimalTodo(
  _prevState: ActionResult<AnimalTodo> | null,
  formData: FormData,
): Promise<ActionResult<AnimalTodo>> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const raw = {
    animalId: formData.get("animalId"),
    type: formData.get("type"),
    description: (formData.get("description") as string)?.trim() || "",
    dueDate: (formData.get("dueDate") as string)?.trim() || undefined,
    priority: formData.get("priority") || undefined,
  };

  const parsed = createAnimalTodoSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const animal = await getAnimalById(parsed.data.animalId);
  if (!animal) {
    return { success: false, error: "Dier niet gevonden" };
  }

  const session = await getSession();

  try {
    const [record] = await db
      .insert(animalTodos)
      .values({
        animalId: parsed.data.animalId,
        type: parsed.data.type,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate || null,
        priority: parsed.data.priority,
        createdByUserId: session?.userId ?? null,
      })
      .returning();

    await logAudit("create_animal_todo", "animal_todo", record.id, null, record);
    revalidateTodoPaths();

    return { success: true, data: record as AnimalTodo };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het aanmaken. Probeer het later opnieuw.",
    };
  }
}

export async function completeAnimalTodo(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig ID" };
  }

  try {
    const [existing] = await db
      .select()
      .from(animalTodos)
      .where(eq(animalTodos.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Taak niet gevonden" };
    if (existing.isCompleted) return { success: false, error: "Taak is al afgerond" };

    const session = await getSession();

    await db
      .update(animalTodos)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        completedByUserId: session?.userId ?? null,
      })
      .where(eq(animalTodos.id, id));

    await logAudit("complete_animal_todo", "animal_todo", existing.id, existing, {
      ...existing,
      isCompleted: true,
    });
    revalidateTodoPaths();

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het afronden. Probeer het later opnieuw.",
    };
  }
}

export async function deleteAnimalTodo(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig ID" };
  }

  try {
    const [existing] = await db
      .select()
      .from(animalTodos)
      .where(eq(animalTodos.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Taak niet gevonden" };

    await db.delete(animalTodos).where(eq(animalTodos.id, id));

    await logAudit("delete_animal_todo", "animal_todo", existing.id, existing, null);
    revalidateTodoPaths();

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het verwijderen. Probeer het later opnieuw.",
    };
  }
}
