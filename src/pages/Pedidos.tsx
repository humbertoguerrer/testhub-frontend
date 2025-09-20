import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import Banner from "../components/Banner";
import { useApi } from "../lib/useApi";

type Pedido = {
  id: number;
  descricao: string;
  valor: number;      // Ex.: 512.9
  status: "ABERTO" | "PAGO" | "CANCELADO" | string;
  pessoaId: number;
};

type Pessoa = {
  id: number;
  nome: string;
};

// Formatadores / Máscara de dinheiro
const fmtReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function somenteDigitos(valor: string) { return valor.replace(/\D/g, ""); }
function formatarMoedaBR(entrada: string) {
  const digitos = somenteDigitos(entrada);
  const semZeros = digitos.replace(/^0+/, "");
  const base = (semZeros === "" ? "0" : semZeros).padStart(3, "0");
  const cents = base.slice(-2);
  let inteiro = base.slice(0, -2);
  inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${inteiro},${cents}`;
}
function desformatarMoedaBR(mask: string) {
  const digitos = somenteDigitos(mask);
  if (!digitos) return 0;
  const centavos = parseInt(digitos, 10);
  return centavos / 100;
}

export default function Pedidos() {
  const { apiFetch } = useApi();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Formulário
  const [descricao, setDescricao] = useState("");
  const [valorTexto, setValorTexto] = useState(""); // máscara "512,90"
  const [status, setStatus] = useState<Pedido["status"]>("ABERTO");
  const [pessoaId, setPessoaId] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);

  // Busca/Ordenação
  const [busca, setBusca] = useState("");
  const [ordCampo, setOrdCampo] = useState<"descricao" | "status" | "valor">("descricao");
  const [ordDirecao, setOrdDirecao] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    (async () => {
      try {
        const [ped, pes] = await Promise.all([
          apiFetch("/pedidos").then(r => r.json()),
          apiFetch("/pessoas").then(r => r.json()),
        ]);
        setPedidos(ped);
        setPessoas(pes);
      } finally {
        setCarregando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers do campo Valor (máscara) ---
  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatado = formatarMoedaBR(e.target.value);
    setValorTexto(formatado);
  }

  function handleValorKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const liberadas = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
    if (liberadas.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return; // copiar/colar
    if (/\d/.test(e.key)) return;       // apenas números
    e.preventDefault();                  // bloqueia e/E/+/-/., letras etc.
  }

  function limparFormulario() {
    setDescricao("");
    setValorTexto("");
    setStatus("ABERTO");
    setPessoaId("");
    setIdEmEdicao(null);
    setMensagem("");
  }

  async function salvarPedido(e: FormEvent) {
    e.preventDefault();

    const valorNumero = desformatarMoedaBR(valorTexto);
    const body = { descricao, valor: valorNumero, status, pessoaId: pessoaId ? Number(pessoaId) : null };

    const path = idEmEdicao ? `/pedidos/${idEmEdicao}` : "/pedidos";
    const method = idEmEdicao ? "PUT" : "POST";

    try {
      const res = await apiFetch(path, { method, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Erro ao salvar");
      limparFormulario();
      setMensagem(idEmEdicao ? "Pedido atualizado com sucesso!" : "Pedido cadastrado com sucesso!");
      const novos = await apiFetch("/pedidos").then(r => r.json());
      setPedidos(novos);
    } catch {
      setMensagem("Erro ao salvar pedido.");
    }
  }

  async function excluirPedido(id: number) {
    if (!window.confirm("Tem certeza que deseja excluir este pedido?")) return;
    try {
      const res = await apiFetch(`/pedidos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      setMensagem("Pedido excluído com sucesso!");
      const novos = await apiFetch("/pedidos").then(r => r.json());
      setPedidos(novos);
    } catch {
      setMensagem("Erro ao excluir pedido.");
    }
  }

  function editarPedido(pedido: Pedido) {
    setDescricao(pedido.descricao);
    const centavos = Math.round((pedido.valor ?? 0) * 100);
    setValorTexto(formatarMoedaBR(String(centavos)));
    setStatus(pedido.status);
    setPessoaId(pedido.pessoaId?.toString() ?? "");
    setIdEmEdicao(pedido.id);
    setMensagem("");
  }

  // Lista derivada com busca + ordenação
  const pedidosExibidos = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");

    const filtrados = q
      ? pedidos.filter(
          (p) =>
            (p.descricao || "").toLocaleLowerCase("pt-BR").includes(q) ||
            (p.status || "").toLocaleLowerCase("pt-BR").includes(q)
        )
      : pedidos.slice();

    filtrados.sort((a, b) => {
      if (ordCampo === "valor") {
        const va = a.valor ?? 0;
        const vb = b.valor ?? 0;
        return ordDirecao === "asc" ? va - vb : vb - va;
      } else {
        const va = (a as any)[ordCampo]?.toString().toLocaleLowerCase("pt-BR") || "";
        const vb = (b as any)[ordCampo]?.toString().toLocaleLowerCase("pt-BR") || "";
        const cmp = va.localeCompare(vb, "pt-BR");
        return ordDirecao === "asc" ? cmp : -cmp;
      }
    });

    return filtrados;
  }, [pedidos, busca, ordCampo, ordDirecao]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Pedidos</h1>

      {/* Card de Cadastro */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-6 mb-6">
        {mensagem && (
          <Banner
            tipo={mensagem.toLowerCase().includes("sucesso") ? "sucesso" : "erro"}
            texto={mensagem}
          />
        )}

        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {idEmEdicao ? "Editar pedido" : "Cadastrar novo pedido"}
        </h2>

        <form onSubmit={salvarPedido} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Valor</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={valorTexto}
                onChange={handleValorChange}
                onKeyDown={handleValorKeyDown}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Pedido["status"])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ABERTO">Aberto</option>
                <option value="PAGO">Pago</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Pessoa</label>
            <select
              value={pessoaId}
              onChange={(e) => setPessoaId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Selecione uma pessoa</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {idEmEdicao ? "Salvar edição" : "Cadastrar"}
            </button>
            {idEmEdicao && (
              <button
                type="button"
                onClick={limparFormulario}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
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
          placeholder="Buscar por descrição ou status..."
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
            <option value="descricao">Descrição</option>
            <option value="status">Status</option>
            <option value="valor">Valor</option>
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

      {/* Lista de Pedidos */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Lista de pedidos</h2>

        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
          </div>
        ) : pedidosExibidos.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Nenhum pedido encontrado.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pedidosExibidos.map((pedido) => {
              const pessoa = pessoas.find((p) => p.id === pedido.pessoaId);
              return (
                <li key={pedido.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{pedido.descricao}</p>
                    <p className="text-sm text-gray-600">Valor: {fmtReal.format(pedido.valor ?? 0)}</p>
                    <p className="text-sm text-gray-500">Status: {pedido.status}</p>
                    <p className="text-sm text-gray-400">Pessoa: {pessoa ? pessoa.nome : "N/A"}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editarPedido(pedido)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluirPedido(pedido.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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
