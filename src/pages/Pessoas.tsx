import { useEffect, useState } from 'react';

type Pessoa = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  idade: number;
};

function cpfValido(cpf: string): boolean {
  return /^\d{11}$/.test(cpf);
}

function App() {

  const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [idade, setIdade] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/pessoas')
      .then((res) => res.json())
      .then((data) => setPessoas(data))
      .catch(() => { });
  }, []);

  function cadastrarPessoa(e: React.FormEvent) {
    e.preventDefault();

    if (!cpfValido(cpf)) {
      setMensagem('CPF inválido.');
      return;
    }

    if (idade && (Number(idade) < 0 || Number(idade) > 120)) {
      setMensagem('Idade deve estar entre 0 e 120.');
      return;
    }

    const pessoa = {
      nome,
      email,
      cpf: cpf.replace(/\D/g, ''),
      idade: idade ? Number(idade) : null
    };

    const metodo = idEmEdicao ? 'PUT' : 'POST';
    const url = idEmEdicao
      ? `http://localhost:8080/pessoas/${idEmEdicao}`
      : 'http://localhost:8080/pessoas';

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pessoa)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao salvar');
        setNome('');
        setEmail('');
        setCpf('');
        setIdade('');
        setIdEmEdicao(null);
        setMensagem(idEmEdicao ? 'Pessoa atualizada com sucesso!' : 'Pessoa cadastrada com sucesso!');
        return fetch('http://localhost:8080/pessoas');
      })
      .then((res) => res.json())
      .then((data) => setPessoas(data))
      .catch(() => setMensagem('Erro ao salvar pessoa.'));
  }


  function excluirPessoa(id: number) {
    const confirmacao = window.confirm('Tem certeza que deseja excluir esta pessoa?');
    if (!confirmacao) return;

    fetch(`http://localhost:8080/pessoas/${id}`, {
      method: 'DELETE'
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao excluir');
        setMensagem('Pessoa excluída com sucesso!');
        return fetch('http://localhost:8080/pessoas');
      })
      .then((res) => res.json())
      .then((data) => setPessoas(data))
      .catch(() => setMensagem('Erro ao excluir pessoa.'));
  }

  function editarPessoa(pessoa: Pessoa) {
    setNome(pessoa.nome);
    setEmail(pessoa.email);
    setCpf(pessoa.cpf);
    setIdade(pessoa.idade?.toString() ?? '');
    setIdEmEdicao(pessoa.id);
    setMensagem('');
  }

  function cancelarEdicao() {
    setNome('');
    setEmail('');
    setCpf('');
    setIdade('');
    setIdEmEdicao(null);
    setMensagem('');
  }



  return (
    <div style={{ padding: '2rem' }}>
      <h1>Lista de Pessoas</h1>
      <form onSubmit={cadastrarPessoa} style={{ marginBottom: '2rem' }}>
        <h2>Cadastrar nova pessoa</h2>

        <div>
          <label>Nome:</label><br />
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>

        <div>
          <label>Email:</label><br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label>CPF:</label><br />
          <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} required />
        </div>

        <div>
          <label>Idade:</label><br />
          <input type="number" value={idade} onChange={(e) => setIdade(e.target.value)} min="0" max="120" />
        </div>

        <button type="submit" style={{ marginTop: '1rem' }}>
          {idEmEdicao ? 'Salvar edição' : 'Cadastrar'}
        </button>

        {idEmEdicao && (
          <button
            type="button"
            onClick={cancelarEdicao}
            style={{ marginLeft: '1rem' }}
          >
            Cancelar edição
          </button>
        )}
      </form>

      {mensagem && <p>{mensagem}</p>}

      <ul>
        {pessoas.map((pessoa) => (
          <li key={pessoa.id}>
            <strong>{pessoa.nome}</strong> — {pessoa.email} — {pessoa.cpf}
            <button
              onClick={() => editarPessoa(pessoa)}
              style={{ marginLeft: '1rem', cursor: 'pointer' }}
              title="Editar"
            >
              ✏️
            </button>
            <button
              onClick={() => excluirPessoa(pessoa.id)}
              style={{ marginLeft: '0.5rem', cursor: 'pointer' }}
              title="Excluir"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>


    </div>
  );
}

export default App;
