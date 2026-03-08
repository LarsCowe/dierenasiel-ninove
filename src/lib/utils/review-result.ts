export function computeReviewResult(
  reviewMartine: string | null,
  reviewNathalie: string | null,
  reviewSven: string | null,
): string | null {
  const reviews = [reviewMartine, reviewNathalie, reviewSven].filter(Boolean) as string[];
  if (reviews.length === 0) return null;

  // Only consider non-"in_beraad" reviews for the result
  const decidedReviews = reviews.filter((r) => r !== "in_beraad");
  if (decidedReviews.length === 0) return null;

  if (decidedReviews.some((r) => r === "niet_weerhouden")) return "niet_weerhouden";
  if (decidedReviews.length === 3 && decidedReviews.every((r) => r === "geschikt")) return "geschikt";
  return "misschien";
}
