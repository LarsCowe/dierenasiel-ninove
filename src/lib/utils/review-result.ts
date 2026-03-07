export function computeReviewResult(
  reviewMartine: string | null,
  reviewNathalie: string | null,
  reviewSven: string | null,
): string | null {
  const reviews = [reviewMartine, reviewNathalie, reviewSven].filter(Boolean) as string[];
  if (reviews.length === 0) return null;

  if (reviews.some((r) => r === "niet_weerhouden")) return "niet_weerhouden";
  if (reviews.length === 3 && reviews.every((r) => r === "geschikt")) return "geschikt";
  return "misschien";
}
