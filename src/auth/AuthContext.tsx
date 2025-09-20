import { createContext, useContext, useEffect, useState } from "react";

type AuthCtx = {
  token: string | null;
  isAuthenticated: boolean;
  login: (t: string) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("authToken"));
  }, []);

  function login(t: string) {
    localStorage.setItem("authToken", t);
    setToken(t);
  }
  function logout() {
    localStorage.removeItem("authToken");
    setToken(null);
  }

  return (
    <Ctx.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
