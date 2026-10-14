import {
  createContext,
  useContext,
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Link, type LinkProps } from "react-router-dom";
import {
  ArrowLeftIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
  type Icon,
} from "@phosphor-icons/react";

export function cx(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* Botoes --------------------------------------------------------------- */

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "accent"
  | "whatsapp"
  | "inverse";

type Size = "sm" | "md" | "lg";

const BUTTON_VARIANTS: Record<Variant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
  secondary:
    "bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:ring-slate-400 active:bg-slate-100",
  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
  danger:
    "bg-white text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50 hover:ring-red-300 active:bg-red-100",
  // Texto navy: branco sobre laranja fica abaixo de 4.5:1.
  accent: "bg-accent-500 text-navy-950 hover:bg-accent-400 active:bg-accent-600",
  // emerald-700 em vez do verde da marca do WhatsApp, que nao passa com branco.
  whatsapp:
    "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900",
  // Para fundos escuros (hero, faixas navy).
  inverse:
    "text-white ring-1 ring-inset ring-white/30 hover:bg-white/10 active:bg-white/15",
};

// Alturas minimas de 40/44/48px para toque; o texto pode quebrar linha.
const BUTTON_SIZES: Record<Size, string> = {
  sm: "min-h-10 gap-1.5 rounded-lg px-3.5 py-2 text-sm",
  md: "min-h-11 gap-2 rounded-lg px-4 py-2.5 text-sm",
  lg: "min-h-12 gap-2 rounded-xl px-6 py-3 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cx(
    "inline-flex items-center justify-center text-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, className })} {...props} />
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
}

// Link com aparencia de botao. Evita <Link><Button /></Link>, que aninha dois
// elementos interativos e cria duas paradas de Tab para a mesma acao.
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props} />
  );
}

/* Campos de formulario ------------------------------------------------- */

// O Field repassa erro, dica e obrigatoriedade para o controle dentro dele,
// sem que cada pagina precise montar ids e atributos aria na mao.
interface FieldState {
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldState>({
  invalid: false,
  required: false,
});

function useFieldAria() {
  const field = useContext(FieldContext);
  return {
    "aria-describedby": field.describedBy,
    "aria-invalid": field.invalid || undefined,
    "aria-required": field.required || undefined,
  };
}

function FieldMessage({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: string;
  error?: string;
}) {
  if (error) {
    return (
      <p
        id={id}
        className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700"
      >
        <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-sm text-slate-500">
        {hint}
      </p>
    );
  }
  return null;
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-red-600">
      *
    </span>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
  error,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-mensagem`;
  const hasMessage = Boolean(error || hint);
  return (
    <FieldContext.Provider
      value={{
        describedBy: hasMessage ? messageId : undefined,
        invalid: Boolean(error),
        required: Boolean(required),
      }}
    >
      <div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-800">
            {label}
            {required && <RequiredMark />}
          </span>
          {children}
        </label>
        <FieldMessage id={messageId} hint={hint} error={error} />
      </div>
    </FieldContext.Provider>
  );
}

// Para grupos de botoes ou opcoes: legenda no lugar de <label>, que so pode
// rotular um controle.
export function FieldSet({
  legend,
  hint,
  required,
  error,
  children,
}: {
  legend: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-mensagem`;
  const hasMessage = Boolean(error || hint);
  return (
    <fieldset aria-describedby={hasMessage ? messageId : undefined}>
      <legend className="mb-2 text-sm font-medium text-slate-800">
        {legend}
        {required && <RequiredMark />}
      </legend>
      {children}
      <FieldMessage id={messageId} hint={hint} error={error} />
    </fieldset>
  );
}

// text-base no celular evita o zoom automatico do iOS em campos < 16px.
const FIELD_BASE =
  "block w-full rounded-lg border border-slate-300 bg-white text-base text-slate-900 transition-colors duration-150 placeholder:text-slate-500 hover:border-slate-400 focus:border-primary-600 focus:outline-hidden focus:ring-4 focus:ring-primary-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 aria-[invalid=true]:border-red-600 aria-[invalid=true]:focus:ring-red-600/15 sm:text-sm";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const aria = useFieldAria();
  return (
    <input className={cx(FIELD_BASE, "h-11 px-3.5", className)} {...aria} {...props} />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const aria = useFieldAria();
  return (
    <textarea
      className={cx(FIELD_BASE, "min-h-28 px-3.5 py-2.5 leading-relaxed", className)}
      {...aria}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const aria = useFieldAria();
  return (
    <span className="relative block">
      <select
        className={cx(FIELD_BASE, "h-11 appearance-none pl-3.5 pr-10", className)}
        {...aria}
        {...props}
      >
        {children}
      </select>
      <CaretDownIcon
        weight="bold"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500"
      />
    </span>
  );
}

/* Feedback ------------------------------------------------------------- */

type AlertTone = "info" | "success" | "warning" | "danger";

const ALERT_TONES: Record<AlertTone, { className: string; icon: Icon }> = {
  info: {
    className: "bg-primary-50 text-primary-900 ring-primary-200",
    icon: InfoIcon,
  },
  success: {
    className: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    icon: CheckCircleIcon,
  },
  warning: {
    className: "bg-amber-50 text-amber-900 ring-amber-200",
    icon: WarningIcon,
  },
  danger: {
    className: "bg-red-50 text-red-800 ring-red-200",
    icon: WarningCircleIcon,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { className: toneClass, icon: ToneIcon } = ALERT_TONES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cx(
        "flex gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset",
        toneClass,
        className,
      )}
    >
      <ToneIcon weight="fill" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return <Alert tone="danger">{message}</Alert>;
}

export function queryErrorMessage(
  error: unknown,
  fallback = "Nao foi possivel carregar os dados.",
): string {
  return error instanceof Error ? error.message : fallback;
}

// Vai dentro do botao durante o envio, ao lado do texto ("Enviando...").
export function ButtonSpinner() {
  return <CircleNotchIcon weight="bold" className="size-4 animate-spin" />;
}

export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 text-sm text-slate-600"
    >
      <CircleNotchIcon
        weight="bold"
        className="size-5 animate-spin text-primary-600"
      />
      {label}
    </div>
  );
}

// Bloco cinza no formato do conteudo: reserva o espaco enquanto carrega.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx("animate-pulse rounded-md bg-slate-200", className)}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: EmptyIcon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: Icon;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {EmptyIcon && (
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <EmptyIcon className="size-6" />
        </span>
      )}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/* Estrutura ------------------------------------------------------------ */

export function Card({
  as: Tag = "div",
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "aside";
}) {
  return (
    <Tag
      className={cx("rounded-2xl border border-slate-200 bg-white", className)}
      {...props}
    />
  );
}

// Bloco de um formulario longo, com titulo e icone.
export function FormSection({
  icon: SectionIcon,
  title,
  description,
  children,
}: {
  icon: Icon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card as="section" className="p-6 sm:p-8">
      <h2 className="flex items-center gap-3 text-base font-semibold text-slate-900">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <SectionIcon weight="bold" className="size-5" />
        </span>
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      )}
      <div className="mt-6 space-y-5">{children}</div>
    </Card>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold text-primary-700">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

// Item de uma lista de detalhes (<dl>). O icone ocupa o lugar do rotulo, que
// continua disponivel para leitores de tela.
export function DetailItem({
  icon: ItemIcon,
  label,
  children,
}: {
  icon: Icon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <dt>
        <ItemIcon weight="bold" className="size-4 text-slate-500" />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group -ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-slate-600 transition-colors duration-150 hover:text-primary-700"
    >
      <ArrowLeftIcon
        weight="bold"
        className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5"
      />
      {children}
    </Link>
  );
}
