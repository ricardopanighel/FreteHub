import { Link } from "react-router-dom";
import { TruckIcon } from "@phosphor-icons/react";
import { cx } from "./ui";

export function Logo({
  tone = "dark",
  onClick,
}: {
  tone?: "dark" | "light";
  onClick?: () => void;
}) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="FreteHub, pagina inicial"
      className="inline-flex items-center gap-2.5 rounded-lg"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary-600 text-white">
        <TruckIcon weight="fill" className="size-5" />
      </span>
      <span
        className={cx(
          "text-lg font-extrabold tracking-tight",
          tone === "light" ? "text-white" : "text-slate-900",
        )}
      >
        Frete<span className="text-accent-500">Hub</span>
      </span>
    </Link>
  );
}
