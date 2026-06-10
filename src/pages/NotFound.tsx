import { Link } from "react-router-dom";
import { Button } from "../components/ui";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="text-6xl font-extrabold text-brand-600">404</span>
      <h1 className="mt-2 text-xl font-bold text-slate-900">
        Pagina nao encontrada
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        O endereco que voce acessou nao existe ou foi movido.
      </p>
      <Link to="/" className="mt-6">
        <Button>Voltar ao inicio</Button>
      </Link>
    </div>
  );
}
