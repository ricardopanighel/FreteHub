import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-700 focus:ring-1 focus:ring-slate-200"
      >
        Pular para o conteudo
      </a>
      <Navbar />
      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
