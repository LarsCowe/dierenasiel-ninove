/**
 * Postgres "unique_violation" (23505): de databank hield een dubbele rij tegen.
 *
 * drizzle-orm verpakt elke databankfout in een `DrizzleQueryError`; de Postgres-fout zit dan
 * in `cause` (nagemeten bij de review van story 14.7: `code` is leeg, `cause.code` is
 * "23505"). Wie enkel `err.code` bekijkt, herkent de fout in productie nooit.
 */
export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const fout = err as { code?: unknown; cause?: { code?: unknown } };
  return (fout.code ?? fout.cause?.code) === "23505";
}
