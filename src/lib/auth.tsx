import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "./types";
import {
  SESSION_EXPIRED_EVENT,
  login as apiLogin,
  registerClient as apiRegister,
} from "./api";

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  // true quando a sessao caiu sozinha (token expirado ou recusado pela API).
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "fretehub:auth";
const EMPTY: AuthState = { user: null, token: null };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Le o campo "exp" (segundos) do payload do JWT. So para saber quando a
// sessao vence; quem valida a assinatura e a API.
function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt !== null && expiresAt <= Date.now();
}

function loadInitial(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthState;
      if (parsed.token && !isExpired(parsed.token)) return parsed;
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignora estado corrompido
  }
  return EMPTY;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadInitial);
  const [sessionExpired, setSessionExpired] = useState(false);

  const persist = useCallback((next: AuthState) => {
    setState(next);
    setSessionExpired(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clear = useCallback(() => {
    setState(EMPTY);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const expire = useCallback(() => {
    clear();
    setSessionExpired(true);
  }, [clear]);

  // A API recusou o token (ex.: chave trocada ao reiniciar a API em dev).
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
  }, [expire]);

  // Encerra a sessao no instante em que o token vence.
  useEffect(() => {
    if (!state.token) return;
    const expiresAt = tokenExpiresAt(state.token);
    if (expiresAt === null) return;
    const timer = setTimeout(expire, Math.max(expiresAt - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [state.token, expire]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user, token } = await apiLogin(email, password);
      persist({ user, token });
    },
    [persist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { user, token } = await apiRegister(name, email, password);
      persist({ user, token });
    },
    [persist],
  );

  const logout = useCallback(() => {
    clear();
    setSessionExpired(false);
  }, [clear]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.user),
      isAdmin: state.user?.role === "ADMIN",
      sessionExpired,
      login,
      register,
      logout,
    }),
    [state, sessionExpired, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
