import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "./ui";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M2 14h13V7a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7Zm13 0h3l3-3.5h-3a1 1 0 0 0-.8.4L15 14Z" />
          <circle cx="6.5" cy="16.5" r="2" fill="none" stroke="#7c2d12" strokeWidth="1.5" />
          <circle cx="16.5" cy="16.5" r="2" fill="none" stroke="#7c2d12" strokeWidth="1.5" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Frete<span className="text-brand-600">Hub</span>
      </span>
    </Link>
  );
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "text-brand-700 bg-brand-50"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
  }`;

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = (
    <>
      <NavLink to="/catalogo" className={linkClass} onClick={() => setOpen(false)}>
        Catalogo
      </NavLink>
      <NavLink
        to="/seja-prestador"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Seja um prestador
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
          Painel da equipe
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">{links}</nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-600">
                Ola, <strong className="text-slate-800">{user?.name}</strong>
              </span>
              <Button variant="secondary" onClick={handleLogout}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/cadastro">
                <Button>Criar conta</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">{links}</nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            {isAuthenticated ? (
              <Button variant="secondary" onClick={handleLogout}>
                Sair ({user?.name})
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link to="/cadastro" onClick={() => setOpen(false)}>
                  <Button className="w-full">Criar conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
