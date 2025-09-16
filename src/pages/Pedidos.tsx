import { useEffect, useState } from 'react';

interface Pessoa {
  id: number;
  nome: string;
}

interface PedidoDTO {
  descricao: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  pessoaId: number;
}

export default function Pedidos() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'PENDENTE' | 'PAGO' | 'CANCELADO'>('PENDENTE');
  const [pessoaId, setPessoaId] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/pessoas')
      .then((res) => res.json())
      .then((data) => setPessoas(data))
      .catch(() => setMensagem('Erro ao carregar pessoas.'));
  }, []);

  function cadastrarPedido(e: React.FormEvent) {
    e.preventDefault();

    const pedido: PedidoDTO = {
      descricao,
      valor: parseFloat(valor),
      status,
      pessoaId: Number(pessoaId)
    };

    fetch('http://localhost:8080/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erro');
        setMensagem('Pedido cadastrado com sucesso!');
        setDescricao('');
        setValor('');
        setStatus('PENDENTE');
        setPessoaId('');
      })
      .catch(() => setMensagem('Erro ao cadastrar pedido.'));
  }

  return (
    <div>
      <h1>Cadastrar Pedido</h1>
      <form onSubmit={cadastrarPedido}>
        <div>
          <label>Descrição:</label><br />
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
        </div>

        <div>
          <label>Valor (R$):</label><br />
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <label>Status:</label><br />
          <select value={status} onChange={(e) => setStatus(e.target.value as PedidoDTO['status'])}>
            <option value="PENDENTE">PENDENTE</option>
            <option value="PAGO">PAGO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </div>

        <div>
          <label>Pessoa:</label><br />
          <select value={pessoaId} onChange={(e) => setPessoaId(e.target.value)} required>
            <option value="">Selecione uma pessoa</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <button type="submit" style={{ marginTop: '1rem' }}>Cadastrar Pedido</button>
      </form>

      {mensagem && <p style={{ marginTop: '1rem' }}>{mensagem}</p>}
    </div>
  );
}