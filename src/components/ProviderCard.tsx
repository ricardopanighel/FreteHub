import { Link } from "react-router-dom";
import type { Provider } from "../lib/types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { Badge } from "./Badge";
import { RatingStars, averageRating } from "./RatingStars";

export function ProviderCard({ provider }: { provider: Provider }) {
  const avg = averageRating(provider.reviews);
  return (
    <Link
      to={`/prestador/${provider.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <img
          src={provider.photoUrl}
          alt={`Foto de ${provider.name}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3">
          <Badge tone="brand">{VEHICLE_LABELS[provider.vehicleType]}</Badge>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">
              {provider.name}
            </h3>
            {provider.reviews.length > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                <RatingStars value={avg} />
                {avg.toFixed(1)}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {provider.headline}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {provider.services.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {SERVICE_LABELS[s]}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-500" fill="currentColor">
            <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
          <span className="line-clamp-1">{provider.regions.join(", ")}</span>
        </div>
      </div>
    </Link>
  );
}
