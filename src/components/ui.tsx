import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

function cx(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-sm",
  secondary:
    "bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 shadow-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
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
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

const FIELD_BASE =
  "w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={cx(FIELD_BASE, className)} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea className={cx(FIELD_BASE, "min-h-24", className)} {...rest} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select className={cx(FIELD_BASE, "pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
      {message}
    </p>
  );
}

export function queryErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Nao foi possivel carregar os dados.";
}

export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
