import { useAuth } from "../auth/AuthContext";

export function useApi() {
  const { token, logout } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

  async function apiFetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

    const res = await fetch(`${baseUrl}${path}`, { ...init, headers });

    if (res.status === 401) {
      // token inválido/expirado: limpa e envia para login
      logout();
      window.location.href = "/login";
      throw new Error("Não autorizado");
    }
    return res;
  }

  return { apiFetch, baseUrl };
}
