import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const footerLink =
  "inline-flex min-h-11 items-center text-slate-300 transition-colors duration-150 hover:text-white";

export function Footer() {
  return (
    <footer className="surface-dark bg-navy-950 text-sm text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs leading-relaxed">
            Catalogo com curadoria de motoristas de fretes urbanos e pequenas
            mudancas. Contrate com mais seguranca e transparencia.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-white">Plataforma</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link to="/catalogo" className={footerLink}>
                Catalogo de motoristas
              </Link>
            </li>
            <li>
              <Link to="/solicitar" className={footerLink}>
                Solicitar frete
              </Link>
            </li>
            <li>
              <Link to="/seja-motorista" className={footerLink}>
                Seja um motorista
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-white">Em breve</h2>
          <ul className="mt-4 space-y-3 text-slate-400">
            <li>Notificacoes por push</li>
            <li>Rastreio por GPS</li>
            <li>Chat e mapas</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-white">Equipe</h2>
          <ul className="mt-4 space-y-3">
            <li>Caio Monte Alegre</li>
            <li>Lucas Silva Fagundes</li>
            <li>Ricardo Panighel Lazarini</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} FreteHub - Projeto academico (MVP).
        </p>
      </div>
    </footer>
  );
}
