import { StarIcon } from "@phosphor-icons/react";
import type { Review } from "../lib/types";
import { cx } from "./ui";

export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function formatRating(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function RatingStars({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "lg";
}) {
  const full = Math.round(value);
  return (
    <span
      role="img"
      aria-label={`Nota ${formatRating(value)} de 5`}
      className="inline-flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          weight={i <= full ? "fill" : "regular"}
          className={cx(
            size === "lg" ? "size-5" : "size-4",
            i <= full ? "text-amber-500" : "text-slate-300",
          )}
        />
      ))}
    </span>
  );
}
