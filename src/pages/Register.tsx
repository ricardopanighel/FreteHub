import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlusIcon } from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";
import { AuthShell } from "../components/AuthShell";
import { Alert, Button, ButtonSpinner, Field, Input } from "../components/ui";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas nao conferem.");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Criar conta"
      description="Crie sua conta de cliente para solicitar fretes e avaliar prestadores."
    >
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <Field label="Nome completo" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            required
          />
        </Field>
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
        <Field label="Senha" required hint="Minimo de 6 caracteres.">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Confirmar senha" required>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a senha"
            autoComplete="new-password"
            required
          />
        </Field>

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <ButtonSpinner />
              Criando...
            </>
          ) : (
            <>
              <UserPlusIcon weight="bold" className="size-5" />
              Criar conta
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Ja tem conta?{" "}
        <Link
          to="/login"
          className="font-semibold text-primary-700 underline-offset-4 hover:text-primary-800 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
