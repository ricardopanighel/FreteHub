import type { ReactNode } from "react";
import {
  ClipboardTextIcon,
  SealCheckIcon,
  StarIcon,
  type Icon,
} from "@phosphor-icons/react";

const HIGHLIGHTS: { icon: Icon; title: string; text: string }[] = [
  {
    icon: SealCheckIcon,
    title: "Prestadores validados",
    text: "Cada perfil passa pela curadoria da equipe antes de ser publicado.",
  },
  {
    icon: ClipboardTextIcon,
    title: "Pedidos acompanhados",
    text: "Registre o frete e acompanhe o status em Meus fretes.",
  },
  {
    icon: StarIcon,
    title: "Avaliacoes de clientes",
    text: "Veja como foi a experiencia de outros clientes e deixe a sua.",
  },
];

// Moldura das telas de login e cadastro. O painel lateral so aparece em telas
// largas; no celular fica apenas o formulario.
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16">
      <div className="mx-auto w-full max-w-md lg:max-w-none">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 text-base text-slate-600">{description}</p>
        {children}
      </div>

      <aside className="surface-dark hidden rounded-3xl bg-navy-950 p-10 text-white lg:order-first lg:block">
        <p className="text-sm font-semibold text-accent-400">FreteHub</p>
        <p className="mt-3 text-3xl font-bold leading-tight tracking-tight">
          Fretes urbanos e mudancas curtas, com gente de confianca
        </p>
        <ul className="mt-10 space-y-6">
          {HIGHLIGHTS.map(({ icon: HighlightIcon, title: itemTitle, text }) => (
            <li key={itemTitle} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-400">
                <HighlightIcon weight="duotone" className="size-6" />
              </span>
              <div>
                <p className="font-semibold">{itemTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
