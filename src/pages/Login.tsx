import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { InfoIcon, SignInIcon } from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";
import { AuthShell } from "../components/AuthShell";
import { Alert, Button, ButtonSpinner, Field, Input } from "../components/ui";

export function Login() {
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Entrar"
      description="Acesse sua conta para solicitar fretes e avaliar prestadores."
    >
      {sessionExpired && (
        <Alert tone="warning" className="mt-6">
          Sua sessao expirou. Entre novamente para continuar.
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <Field label="E-mail" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Senha" required>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            autoComplete="current-password"
            required
          />
        </Field>

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <ButtonSpinner />
              Entrando...
            </>
          ) : (
            <>
              <SignInIcon weight="bold" className="size-5" />
              Entrar
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Nao tem conta?{" "}
        <Link
          to="/cadastro"
          className="font-semibold text-primary-700 underline-offset-4 hover:text-primary-800 hover:underline"
        >
          Criar conta
        </Link>
      </p>

      <div className="mt-6 flex gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
        <InfoIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-slate-500" />
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">Contas de demonstracao</p>
          <dl className="mt-1 space-y-0.5">
            <div className="flex flex-wrap gap-x-1.5">
              <dt className="font-medium text-slate-700">Admin:</dt>
              <dd className="min-w-0 break-words">admin@fretehub.com / admin123</dd>
            </div>
            <div className="flex flex-wrap gap-x-1.5">
              <dt className="font-medium text-slate-700">Cliente:</dt>
              <dd className="min-w-0 break-words">
                cliente@fretehub.com / cliente123
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AuthShell>
  );
}
