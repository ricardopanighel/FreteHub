import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ClipboardTextIcon,
  EnvelopeSimpleIcon,
  InfoIcon,
  ListChecksIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  UserCircleDashedIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import { addReview, getProvider } from "../lib/api";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { useAuth } from "../lib/auth";
import { formatDate, initials, onlyDigits } from "../lib/format";
import { profileGreeting, whatsappLink, whatsappNumber } from "../lib/whatsapp";
import { Badge, VerifiedBadge } from "../components/Badge";
import {
  RatingStars,
  averageRating,
  formatRating,
} from "../components/RatingStars";
import { VehicleIcon } from "../components/VehicleIcon";
import {
  Alert,
  BackLink,
  Button,
  ButtonLink,
  ButtonSpinner,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Spinner,
  Textarea,
  buttonClasses,
  cx,
  queryErrorMessage,
} from "../components/ui";

const RATING_LABELS = ["Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

function reviewCount(total: number): string {
  return `${total} ${total === 1 ? "avaliacao" : "avaliacoes"}`;
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
          icon={UserCircleDashedIcon}
          title="Prestador nao encontrado"
          description="O perfil que voce procura nao existe ou foi removido."
          action={<ButtonLink to="/catalogo">Voltar ao catalogo</ButtonLink>}
        />
      </div>
    );
  }

  const isPublic = provider.status === "APROVADO";
  const avg = averageRating(provider.reviews);
  const wa = whatsappNumber(provider.contacts.whatsapp);
  const requestPath = `/solicitar?prestador=${provider.id}`;

  return (
    <div>
      {/* Cabecalho do perfil */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
          <BackLink to="/catalogo">Voltar ao catalogo</BackLink>

          {!isPublic && (
            <Alert tone="warning" className="mt-4">
              Este perfil ainda nao esta publicado no catalogo (status:{" "}
              {provider.status.toLowerCase()}).
            </Alert>
          )}

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={provider.photoUrl}
              alt={`Foto de ${provider.name}`}
              className="size-28 shrink-0 rounded-2xl bg-slate-100 object-cover ring-1 ring-slate-200 sm:size-32"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                {isPublic && <VerifiedBadge />}
                <Badge tone="primary">
                  <VehicleIcon
                    type={provider.vehicleType}
                    weight="bold"
                    className="size-3.5 shrink-0"
                  />
                  {VEHICLE_LABELS[provider.vehicleType]}
                </Badge>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {provider.name}
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
                {provider.headline}
              </p>
              {provider.reviews.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <RatingStars value={avg} size="lg" />
                  <span aria-hidden="true" className="font-semibold text-slate-900">
                    {formatRating(avg)}
                  </span>
                  <span>({reviewCount(provider.reviews.length)})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* No celular o contato vem logo depois do "Sobre", antes das
          avaliacoes; em telas largas ele vira a coluna lateral fixa. */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-3">
        <Card as="section" aria-labelledby="sobre-titulo" className="p-6 sm:p-8 lg:col-span-2">
          <h2 id="sobre-titulo" className="text-lg font-semibold text-slate-900">
            Sobre
          </h2>
          <p className="mt-3 whitespace-pre-line break-words text-base leading-relaxed text-slate-700">
            {provider.bio}
          </p>

          <div className="mt-8 grid gap-8 border-t border-slate-100 pt-8 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <VehicleIcon
                  type={provider.vehicleType}
                  weight="duotone"
                  className="size-5 text-primary-600"
                />
                Veiculo
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {provider.vehicleDescription}
              </p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MapPinIcon weight="duotone" className="size-5 text-primary-600" />
                Regioes atendidas
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {provider.regions.map((r) => (
                  <li
                    key={r}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ListChecksIcon weight="duotone" className="size-5 text-primary-600" />
              Servicos oferecidos
            </h3>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {provider.services.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircleIcon weight="fill" className="size-5 shrink-0 text-emerald-600" />
                  {SERVICE_LABELS[s]}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Contato */}
        <aside className="lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <Card className="p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-slate-900">
              Falar com {provider.name.split(" ")[0]}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Registre o pedido no FreteHub ou fale direto para negociar preco
              e condicoes.
            </p>

            <div className="mt-6 space-y-3">
              {isPublic && (
                <ButtonLink
                  to={isAuthenticated ? requestPath : "/login"}
                  state={isAuthenticated ? undefined : { from: requestPath }}
                  size="lg"
                  className="w-full"
                >
                  <ClipboardTextIcon weight="bold" className="size-5" />
                  Solicitar frete
                </ButtonLink>
              )}

              {wa && (
                <div>
                  <a
                    href={whatsappLink(wa, profileGreeting())}
                    target="_blank"
                    rel="noreferrer"
                    aria-describedby="whatsapp-dica"
                    className={buttonClasses({ variant: "whatsapp", className: "w-full" })}
                  >
                    <WhatsappLogoIcon weight="fill" className="size-5" />
                    Chamar no WhatsApp
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                  <p id="whatsapp-dica" className="mt-1.5 text-center text-xs text-slate-500">
                    A conversa abre com uma mensagem pronta.
                  </p>
                </div>
              )}

              {provider.contacts.phone && (
                <a
                  href={`tel:${onlyDigits(provider.contacts.phone)}`}
                  className={buttonClasses({ variant: "secondary", className: "w-full" })}
                >
                  <PhoneIcon weight="bold" className="size-4 text-primary-600" />
                  {provider.contacts.phone}
                </a>
              )}

              {provider.contacts.email && (
                <a
                  href={`mailto:${provider.contacts.email}`}
                  className={buttonClasses({ variant: "secondary", className: "w-full" })}
                >
                  <EnvelopeSimpleIcon weight="bold" className="size-4 text-primary-600" />
                  E-mail
                </a>
              )}
            </div>

            <p className="mt-6 flex gap-2 border-t border-slate-100 pt-5 text-xs leading-relaxed text-slate-500">
              <InfoIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
              O FreteHub nao participa da negociacao nesta etapa. Combine os
              detalhes diretamente com o prestador.
            </p>
          </Card>
        </aside>

        {/* Avaliacoes */}
        <Card as="section" aria-labelledby="avaliacoes-titulo" className="p-6 sm:p-8 lg:col-span-2">
          <h2 id="avaliacoes-titulo" className="text-lg font-semibold text-slate-900">
            Avaliacoes
          </h2>

          {isAuthenticated ? (
            <form
              className="mt-6 space-y-5 rounded-xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200"
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) reviewMutation.mutate();
              }}
            >
              {/* Radios de verdade (escondidos) por baixo das estrelas: as
                  setas do teclado trocam a nota e o leitor anuncia "3 de 5". */}
              <fieldset>
                <legend className="text-sm font-medium text-slate-800">Sua nota</legend>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label
                        key={n}
                        className="cursor-pointer rounded-md p-0.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-primary-600"
                      >
                        <input
                          type="radio"
                          name="rating"
                          value={n}
                          checked={rating === n}
                          onChange={() => setRating(n)}
                          // Enter escolhe a nota em vez de enviar o formulario.
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            setRating(n);
                          }}
                          className="sr-only"
                        />
                        <StarIcon
                          weight={n <= rating ? "fill" : "regular"}
                          className={cx(
                            "size-8 transition-colors duration-150",
                            n <= rating
                              ? "text-amber-500"
                              : "text-slate-500 hover:text-amber-500",
                          )}
                        />
                        <span className="sr-only">
                          {n} {n === 1 ? "estrela" : "estrelas"}, {RATING_LABELS[n - 1]}
                        </span>
                      </label>
                    ))}
                  </div>
                  <span aria-hidden="true" className="text-sm font-semibold text-slate-700">
                    {RATING_LABELS[rating - 1]}
                  </span>
                </div>
              </fieldset>

              <Field label="Comentario" required>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte como foi sua experiencia com este prestador..."
                  required
                />
              </Field>

              {reviewMutation.isError && (
                <Alert tone="danger">
                  {queryErrorMessage(
                    reviewMutation.error,
                    "Nao foi possivel publicar a avaliacao.",
                  )}
                </Alert>
              )}
              {reviewMutation.isSuccess && (
                <Alert tone="success">
                  Avaliacao publicada. Obrigado por contar sua experiencia.
                </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={reviewMutation.isPending}>
                  {reviewMutation.isPending ? (
                    <>
                      <ButtonSpinner />
                      Enviando...
                    </>
                  ) : (
                    "Publicar avaliacao"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
              <Link
                to="/login"
                className="font-semibold text-primary-700 underline-offset-4 hover:underline"
              >
                Entre na sua conta
              </Link>{" "}
              para deixar uma avaliacao.
            </p>
          )}

          {provider.reviews.length === 0 ? (
            <p className="mt-6 text-sm text-slate-600">
              Este prestador ainda nao possui avaliacoes.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-slate-100">
              {provider.reviews.map((r) => (
                <li key={r.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-700"
                  >
                    {initials(r.authorName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="font-semibold text-slate-900">{r.authorName}</p>
                      <RatingStars value={r.rating} />
                    </div>
                    <p className="mt-1.5 break-words text-sm leading-relaxed text-slate-700">
                      {r.comment}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      <time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
