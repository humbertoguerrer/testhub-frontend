import { useEffect, useState } from 'react';

type Pessoa = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  idade: number;
};

function App() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);

  useEffect(() => {
    fetch('http://localhost:8080/pessoas')
      .then((res) => res.json())
      .then((data) => setPessoas(data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Lista de Pessoas</h1>
      <ul>
        {pessoas.map((p) => (
          <li key={p.id}>
            <strong>{p.nome}</strong> — {p.email} — {p.cpf}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
