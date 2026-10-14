import { Link } from "react-router-dom";
import { MapPinIcon, SealCheckIcon, StarIcon } from "@phosphor-icons/react";
import type { Provider } from "../lib/types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { averageRating, formatRating } from "./RatingStars";
import { VehicleIcon } from "./VehicleIcon";
import { Skeleton } from "./ui";

const VISIBLE_SERVICES = 3;

// O card inteiro e clicavel, mas o link e so o nome: leitores de tela anunciam
// "Carlos Transportes" em vez do texto do card todo.
export function ProviderCard({ provider }: { provider: Provider }) {
  const avg = averageRating(provider.reviews);
  const hiddenServices = provider.services.length - VISIBLE_SERVICES;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors duration-200 hover:border-primary-300 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-primary-600">
      <div className="relative aspect-[16/10] bg-slate-100">
        <img
          src={provider.photoUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-900/10">
          <VehicleIcon
            type={provider.vehicleType}
            weight="bold"
            className="size-4 text-primary-600"
          />
          {VEHICLE_LABELS[provider.vehicleType]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
            <Link
              to={`/prestador/${provider.id}`}
              className="transition-colors duration-150 after:absolute after:inset-0 group-hover:text-primary-700 focus-visible:outline-hidden"
            >
              {provider.name}
            </Link>
            {provider.status === "APROVADO" && (
              <SealCheckIcon
                weight="fill"
                className="size-4 shrink-0 text-primary-600"
                aria-hidden={false}
                aria-label="Validado pela equipe"
                role="img"
              />
            )}
          </h3>
          {provider.reviews.length > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-800">
              <StarIcon weight="fill" className="size-4 text-amber-500" />
              <span className="sr-only">Nota</span>
              {formatRating(avg)}
              <span className="font-normal text-slate-500">
                ({provider.reviews.length}
                <span className="sr-only"> avaliacoes</span>)
              </span>
            </span>
          )}
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {provider.headline}
        </p>

        <ul className="my-4 flex flex-wrap gap-1.5" aria-label="Servicos">
          {provider.services.slice(0, VISIBLE_SERVICES).map((s) => (
            <li
              key={s}
              className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
            >
              {SERVICE_LABELS[s]}
            </li>
          ))}
          {hiddenServices > 0 && (
            <li className="rounded-md px-1.5 py-1 text-xs font-medium text-slate-500">
              +{hiddenServices}
              <span className="sr-only"> outros no perfil</span>
            </li>
          )}
        </ul>

        <p className="mt-auto flex items-start gap-1.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <MapPinIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-primary-600" />
          <span className="sr-only">Atende em:</span>
          <span className="line-clamp-2">{provider.regions.join(", ")}</span>
        </p>
      </div>
    </article>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Grade de placeholders com o mesmo layout da grade real, sem salto de layout
// quando os dados chegam. O texto fica so para leitores de tela.
export function ProviderGridSkeleton({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  return (
    <div>
      <p role="status" className="sr-only">
        {label}
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <ProviderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
