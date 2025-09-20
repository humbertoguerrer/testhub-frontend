import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import Banner from "../components/Banner";
import { useApi } from "../lib/useApi";

type Pessoa = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  idade: number | null;
};

type Pedido = {
  id: number;
  pessoaId: number;
};

// --- Helpers CPF/idade/teclado ---
function somenteDigitos(v: string) { return v.replace(/\D/g, ""); }
function formatarCPF(v: string) {
  const d = somenteDigitos(v).slice(0, 11);
  const p1 = d.slice(0, 3), p2 = d.slice(3, 6), p3 = d.slice(6, 9), p4 = d.slice(9, 11);
  let out = p1;
  if (d.length > 3) out += "." + p2;
  if (d.length > 6) out += "." + p3;
  if (d.length > 9) out += "-" + p4;
  return out;
}
function cpfValido(cpf: string) { return /^\d{11}$/.test(somenteDigitos(cpf)); }
function bloquearNaoNumerico(e: KeyboardEvent<HTMLInputElement>) {
  const ok = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"];
  if (ok.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (/\d/.test(e.key)) return;
  e.preventDefault();
}
function normalizarIdade(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 3);
  if (!d) return "";
  let n = parseInt(d, 10); if (isNaN(n)) return "";
  if (n > 120) n = 120; if (n < 0) n = 0;
  return String(n);
}

export default function Pessoas() {
  const { apiFetch } = useApi();

  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [vinculos, setVinculos] = useState<Record<number, number>>({}); // pessoaId -> qtd pedidos

  // Form
  const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");     // armazenamos mascarado na UI
  const [idade, setIdade] = useState(""); // string p/ máscara/limite

  // Busca/Ordenação
  const [busca, setBusca] = useState("");
  const [ordCampo, setOrdCampo] = useState<"nome" | "email" | "idade">("nome");
  const [ordDirecao, setOrdDirecao] = useState<"asc" | "desc">("asc");

  // Carregar pessoas e pedidos (para montar vinculos)
  useEffect(() => {
    (async () => {
      try {
        const [pessoasRes, pedidosRes] = await Promise.all([
          apiFetch("/pessoas").then(r => r.json()),
          apiFetch("/pedidos").then(r => r.json()),
        ]);
        setPessoas(pessoasRes);
        const counts: Record<number, number> = {};
        (pedidosRes as Pedido[]).forEach(p => { counts[p.pessoaId] = (counts[p.pessoaId] || 0) + 1; });
        setVinculos(counts);
      } finally {
        setCarregando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function recarregar() {
    const [pessoasRes, pedidosRes] = await Promise.all([
      apiFetch("/pessoas").then(r => r.json()),
      apiFetch("/pedidos").then(r => r.json()),
    ]);
    setPessoas(pessoasRes);
    const counts: Record<number, number> = {};
    (pedidosRes as Pedido[]).forEach(p => { counts[p.pessoaId] = (counts[p.pessoaId] || 0) + 1; });
    setVinculos(counts);
  }

  function cancelarEdicao() {
    setNome(""); setEmail(""); setCpf(""); setIdade("");
    setIdEmEdicao(null); setMensagem("");
  }

  function editarPessoa(p: Pessoa) {
    setNome(p.nome);
    setEmail(p.email);
    setCpf(formatarCPF(p.cpf));
    setIdade(p.idade != null ? String(Math.min(p.idade, 120)) : "");
    setIdEmEdicao(p.id);
    setMensagem("");
  }

  async function cadastrarPessoa(e: FormEvent) {
    e.preventDefault();

    if (!cpfValido(cpf)) { setMensagem("CPF inválido. Use 000.000.000-00"); return; }
    const idadeNum = idade ? Math.min(Number(idade), 120) : null;

    const body = { nome, email, cpf: somenteDigitos(cpf), idade: idadeNum };
    const path = idEmEdicao ? `/pessoas/${idEmEdicao}` : "/pessoas";
    const method = idEmEdicao ? "PUT" : "POST";

    try {
      const res = await apiFetch(path, { method, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Erro ao salvar");
      cancelarEdicao();
      setMensagem(idEmEdicao ? "Pessoa atualizada com sucesso!" : "Pessoa cadastrada com sucesso!");
      await recarregar();
    } catch {
      setMensagem("Erro ao salvar pessoa.");
    }
  }

  async function excluirPessoa(id: number) {
    if (!window.confirm("Tem certeza que deseja excluir esta pessoa?")) return;
    if ((vinculos[id] || 0) > 0) { // trava pela UI
      setMensagem("Não é possível excluir: cliente vinculado a pedido(s).");
      return;
    }
    try {
      const res = await apiFetch(`/pessoas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        try {
          const data = await res.json();
          const det = data?.detail || data?.message || "";
          if (res.status === 409) return setMensagem(det || "Não é possível excluir: cliente vinculado a pedido(s).");
          if (res.status === 404) return setMensagem(det || "Pessoa não encontrada.");
        } catch {}
        throw new Error("Erro ao excluir");
      }
      setMensagem("Pessoa excluída com sucesso!");
      await recarregar();
    } catch {
      setMensagem("Erro ao excluir pessoa.");
    }
  }

  // Derivados: busca + ordenação
  const pessoasExibidas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    const filtradas = q
      ? pessoas.filter(p =>
          (p.nome || "").toLocaleLowerCase("pt-BR").includes(q) ||
          (p.email || "").toLocaleLowerCase("pt-BR").includes(q)
        )
      : pessoas.slice();

    filtradas.sort((a, b) => {
      if (ordCampo === "idade") {
        const va = a.idade ?? -1, vb = b.idade ?? -1;
        return ordDirecao === "asc" ? va - vb : vb - va;
      }
      const va = (a[ordCampo] || "").toString().toLocaleLowerCase("pt-BR");
      const vb = (b[ordCampo] || "").toString().toLocaleLowerCase("pt-BR");
      const cmp = va.localeCompare(vb, "pt-BR");
      return ordDirecao === "asc" ? cmp : -cmp;
    });

    return filtradas;
  }, [pessoas, busca, ordCampo, ordDirecao]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Lista de Pessoas</h1>

      {/* Card de Cadastro */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-6 mb-6">
        {mensagem && (
          <Banner
            tipo={mensagem.toLowerCase().includes("sucesso") ? "sucesso" : "erro"}
            texto={mensagem}
          />
        )}

        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {idEmEdicao ? "Editar pessoa" : "Cadastrar nova pessoa"}
        </h2>

        <form className="space-y-4" onSubmit={cadastrarPessoa}>
          <div>
            <label className="block text-sm font-medium text-gray-600">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">CPF</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={14}
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                onKeyDown={bloquearNaoNumerico}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Idade</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={idade}
                onChange={(e) => setIdade(normalizarIdade(e.target.value))}
                onKeyDown={bloquearNaoNumerico}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="0 a 120"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              {idEmEdicao ? "Salvar edição" : "Cadastrar"}
            </button>
            {idEmEdicao && (
              <button type="button" onClick={cancelarEdicao} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filtros/Ordenação */}
      <div className="w-full max-w-2xl mb-3 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        />
        <div className="flex gap-2">
          <select
            value={ordCampo}
            onChange={(e) => setOrdCampo(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="nome">Nome</option>
            <option value="email">Email</option>
            <option value="idade">Idade</option>
          </select>
          <button
            onClick={() => setOrdDirecao(ordDirecao === "asc" ? "desc" : "asc")}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
            title="Alternar ordem"
          >
            {ordDirecao === "asc" ? "Asc" : "Desc"}
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-6">
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
          </div>
        ) : pessoasExibidas.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Nenhuma pessoa encontrada.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pessoasExibidas.map((p) => {
              const bloqueado = (vinculos[p.id] || 0) > 0;
              return (
                <li key={p.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{p.nome}</p>
                    <p className="text-sm text-gray-600">{p.email}</p>
                    <p className="text-sm text-gray-500">{formatarCPF(p.cpf)}</p>
                    {p.idade != null && (
                      <p className="text-sm text-gray-500">Idade: {Math.min(p.idade, 120)}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editarPessoa(p)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => !bloqueado && excluirPessoa(p.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={bloqueado}
                      title={bloqueado ? "Não é possível excluir: cliente vinculado a pedido(s)." : "Excluir"}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
