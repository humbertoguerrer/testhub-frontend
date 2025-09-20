import { useState, FormEvent } from "react";
import Banner from "../components/Banner";
import { useApi } from "../lib/useApi";

type Role = "USER" | "ADMIN";

export default function CadastroUsuario() {
  const { apiFetch } = useApi();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [mensagem, setMensagem] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMensagem("");

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, senha, role }),
      });

      if (!res.ok) {
        let detail = "Erro ao cadastrar usuário.";
        try {
          const data = await res.json();
          detail = data?.message || data?.detail || detail;
        } catch {}
        setMensagem(detail);
        return;
      }

      setMensagem("Usuário cadastrado com sucesso!");
      setEmail("");
      setSenha("");
      setRole("USER");
    } catch {
      setMensagem("Erro ao cadastrar usuário.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Usuário</h1>

      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        {mensagem && (
          <Banner
            tipo={mensagem.toLowerCase().includes("sucesso") ? "sucesso" : "erro"}
            texto={mensagem}
          />
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="usuario@teste.com"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Papel (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Cadastrar
            </button>
          </div>

          <p className="text-xs text-gray-500">
            * Somente administradores podem criar novos usuários (o backend valida via JWT).
          </p>
        </form>
      </div>
    </div>
  );
}
