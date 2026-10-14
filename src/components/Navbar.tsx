import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ListIcon, SignOutIcon, XIcon } from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";
import { initials } from "../lib/format";
import { Logo } from "./Logo";
import { Button, ButtonLink, cx } from "./ui";

const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold transition-colors duration-150",
    isActive
      ? "bg-primary-50 text-primary-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  );

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    "flex min-h-12 items-center rounded-lg px-3 text-base font-semibold transition-colors duration-150",
    isActive
      ? "bg-primary-50 text-primary-700"
      : "text-slate-700 hover:bg-slate-100",
  );

function UserAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700"
    >
      {initials(name)}
    </span>
  );
}

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/");
  };

  const links = (linkClass: typeof desktopLinkClass) => (
    <>
      <NavLink to="/catalogo" className={linkClass} onClick={() => setOpen(false)}>
        Catalogo
      </NavLink>
      {isAuthenticated && !isAdmin && (
        <NavLink
          to="/meus-fretes"
          className={linkClass}
          onClick={() => setOpen(false)}
        >
          Meus fretes
        </NavLink>
      )}
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Logo onClick={() => setOpen(false)} />
          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {links(desktopLinkClass)}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <span className="flex items-center gap-2.5 pr-2 text-sm text-slate-600">
                <UserAvatar name={user?.name ?? ""} />
                <span className="hidden lg:inline">
                  Ola, <strong className="font-semibold text-slate-900">{user?.name}</strong>
                </span>
                <span className="sr-only lg:hidden">Conectado como {user?.name}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <SignOutIcon weight="bold" className="size-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <ButtonLink to="/login" variant="ghost" size="sm">
                Entrar
              </ButtonLink>
              <ButtonLink to="/cadastro" size="sm">
                Criar conta
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-lg text-slate-700 transition-colors duration-150 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
          aria-controls={open ? "menu-mobile" : undefined}
        >
          {open ? (
            <XIcon weight="bold" className="size-6" />
          ) : (
            <ListIcon weight="bold" className="size-6" />
          )}
        </button>
      </div>

      {open && (
        <div
          id="menu-mobile"
          className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 md:hidden"
        >
          <nav aria-label="Principal" className="flex flex-col gap-1">
            {links(mobileLinkClass)}
          </nav>
          <div className="mt-4 border-t border-slate-100 pt-4">
            {isAuthenticated ? (
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3 text-sm text-slate-600">
                  <UserAvatar name={user?.name ?? ""} />
                  <span className="truncate">
                    Ola, <strong className="font-semibold text-slate-900">{user?.name}</strong>
                  </span>
                </span>
                <Button variant="secondary" onClick={handleLogout}>
                  <SignOutIcon weight="bold" className="size-4" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <ButtonLink
                  to="/login"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                >
                  Entrar
                </ButtonLink>
                <ButtonLink to="/cadastro" onClick={() => setOpen(false)}>
                  Criar conta
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
