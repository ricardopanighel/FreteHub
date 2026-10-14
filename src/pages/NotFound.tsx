import { HouseIcon, SignpostIcon } from "@phosphor-icons/react";
import { ButtonLink } from "../components/ui";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:py-28">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <SignpostIcon weight="duotone" className="size-8" />
      </span>
      <p className="mt-6 text-5xl font-extrabold tracking-tight text-primary-600">
        404
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Pagina nao encontrada
      </h1>
      <p className="mt-2 text-base text-slate-600">
        O endereco que voce acessou nao existe ou foi movido.
      </p>
      <ButtonLink to="/" size="lg" className="mt-8">
        <HouseIcon weight="bold" className="size-5" />
        Voltar ao inicio
      </ButtonLink>
    </div>
  );
}
