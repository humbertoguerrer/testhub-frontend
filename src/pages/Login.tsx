import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useApi } from "../lib/useApi";

export default function Login() {
  const { login } = useAuth();
  const { baseUrl } = useApi(); // só para pegar a URL
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Credenciais inválidas");
      }
      const data = await res.json(); // { token, ... }
      login(data.token);
      navigate("/pessoas", { replace: true });
    } catch (err: any) {
      setErro(err.message || "Falha no login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-6">
        <h1 className="text-xl font-semibold mb-4">Entrar na Aplicação</h1>
        {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input
              placeholder="Digite seu e-mail"
              className="w-full border rounded-lg px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Senha</label>
            <input
              placeholder="Digite sua senha"
              type="password"
              className="w-full border rounded-lg px-3 py-2"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
