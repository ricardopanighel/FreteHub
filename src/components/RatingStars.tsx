import type { Review } from "../lib/types";

export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function RatingStars({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "lg";
}) {
  const full = Math.round(value);
  const px = size === "lg" ? "text-xl" : "text-sm";
  return (
    <span
      className={`inline-flex items-center leading-none ${px}`}
      aria-label={`${value} de 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= full ? "text-amber-400" : "text-slate-300"}
        >
          {i <= full ? "\u2605" : "\u2606"}
        </span>
      ))}
    </span>
  );
}
