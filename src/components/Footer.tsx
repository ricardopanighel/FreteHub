import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-lg font-extrabold text-slate-900">
            Frete<span className="text-brand-600">Hub</span>
          </span>
          <p className="mt-2 max-w-xs text-sm text-slate-500">
            Catalogo com curadoria de prestadores de fretes urbanos e pequenas
            mudancas. Contrate com mais seguranca e transparencia.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Plataforma</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link to="/catalogo" className="hover:text-brand-600">
                Catalogo de prestadores
              </Link>
            </li>
            <li>
              <Link to="/solicitar" className="hover:text-brand-600">
                Solicitar frete
              </Link>
            </li>
            <li>
              <Link to="/seja-prestador" className="hover:text-brand-600">
                Seja um prestador
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Em breve</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>Propostas de motoristas</li>
            <li>Notificacoes</li>
            <li>Chat e mapas</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Equipe</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>Caio Monte Alegre</li>
            <li>Lucas Silva Fagundes</li>
            <li>Ricardo Panighel Lazarini</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} FreteHub - Projeto academico (MVP).
      </div>
    </footer>
  );
}
