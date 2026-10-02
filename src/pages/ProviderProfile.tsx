import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addReview, getProvider } from "../lib/api";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { Badge } from "../components/Badge";
import { RatingStars, averageRating } from "../components/RatingStars";
import {
  Button,
  EmptyState,
  ErrorNote,
  Field,
  Spinner,
  Textarea,
  queryErrorMessage,
} from "../components/ui";
import { useAuth } from "../lib/auth";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function ProviderProfile() {
  const { id = "" } = useParams();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: provider, isLoading, isError, error } = useQuery({
    queryKey: ["provider", id],
    queryFn: () => getProvider(id),
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const reviewMutation = useMutation({
    mutationFn: () =>
      addReview(id, {
        rating,
        comment: comment.trim(),
      }),
    onSuccess: () => {
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["provider", id] });
    },
  });

  if (isLoading) return <Spinner label="Carregando perfil..." />;

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorNote message={queryErrorMessage(error)} />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Prestador nao encontrado"
          description="O perfil que voce procura nao existe ou foi removido."
          action={
            <Link to="/catalogo">
              <Button>Voltar ao catalogo</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isPublic = provider.status === "APROVADO";
  const avg = averageRating(provider.reviews);
  const wa = provider.contacts.whatsapp
    ? onlyDigits(provider.contacts.whatsapp)
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        to="/catalogo"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-600"
      >
        &larr; Voltar ao catalogo
      </Link>

      {!isPublic && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          Este perfil ainda nao esta publicado no catalogo (status:{" "}
          {provider.status.toLowerCase()}).
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img
              src={provider.photoUrl}
              alt={`Foto de ${provider.name}`}
              className="h-56 w-full object-cover"
            />
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {provider.name}
                </h1>
                <Badge tone="brand">
                  {VEHICLE_LABELS[provider.vehicleType]}
                </Badge>
              </div>
              <p className="mt-1 text-slate-600">{provider.headline}</p>

              {provider.reviews.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <RatingStars value={avg} size="lg" />
                  <span className="font-semibold">{avg.toFixed(1)}</span>
                  <span className="text-slate-400">
                    ({provider.reviews.length} avaliacao
                    {provider.reviews.length > 1 ? "es" : ""})
                  </span>
                </div>
              )}

              <hr className="my-5 border-slate-100" />

              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Sobre
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {provider.bio}
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Veiculo
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">
                    {provider.vehicleDescription}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Regioes atendidas
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {provider.regions.map((r) => (
                      <span
                        key={r}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Servicos oferecidos
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {provider.services.map((s) => (
                    <Badge key={s}>{SERVICE_LABELS[s]}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Avaliacoes */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Avaliacoes</h2>

            {isAuthenticated ? (
              <form
                className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (comment.trim()) reviewMutation.mutate();
                }}
              >
                <Field label="Sua nota">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setRating(n)}
                        className={`text-2xl leading-none transition ${
                          n <= rating ? "text-amber-400" : "text-slate-300"
                        }`}
                        aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                      >
                        {n <= rating ? "\u2605" : "\u2606"}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="mt-3">
                  <Field label="Comentario">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Conte como foi sua experiencia com este prestador..."
                      required
                    />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button type="submit" disabled={reviewMutation.isPending}>
                    {reviewMutation.isPending
                      ? "Enviando..."
                      : "Publicar avaliacao"}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                <Link
                  to="/login"
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Entre na sua conta
                </Link>{" "}
                para deixar uma avaliacao.
              </p>
            )}

            <div className="mt-4 space-y-3">
              {provider.reviews.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Este prestador ainda nao possui avaliacoes.
                </p>
              ) : (
                provider.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">
                        {r.authorName}
                      </span>
                      <RatingStars value={r.rating} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
                    <span className="mt-1 block text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Coluna de contato */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">
              Falar com {provider.name.split(" ")[0]}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Registre o pedido no FreteHub ou fale direto para negociar preco
              e condicoes.
            </p>

            {isPublic && (
              <Link
                to={
                  isAuthenticated
                    ? `/solicitar?prestador=${provider.id}`
                    : "/login"
                }
                state={
                  isAuthenticated
                    ? undefined
                    : { from: `/solicitar?prestador=${provider.id}` }
                }
                className="mt-4 block"
              >
                <Button className="w-full">Solicitar frete</Button>
              </Link>
            )}

            <div className="mt-4 flex flex-col gap-2.5">
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.5-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.5 0 1.1Z" />
                  </svg>
                  WhatsApp
                </a>
              )}
              {provider.contacts.phone && (
                <a
                  href={`tel:${onlyDigits(provider.contacts.phone)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-600" fill="currentColor">
                    <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11 11 0 0 0 3.5.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.6 3.5a1 1 0 0 1-.3 1l-2.2 2.3Z" />
                  </svg>
                  {provider.contacts.phone}
                </a>
              )}
              {provider.contacts.email && (
                <a
                  href={`mailto:${provider.contacts.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-600" fill="currentColor">
                    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 4v.4l8 4.6 8-4.6V8l-8 4.6L4 8Z" />
                  </svg>
                  E-mail
                </a>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              O FreteHub nao participa da negociacao nesta etapa. Combine os
              detalhes diretamente com o prestador.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
