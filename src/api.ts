const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export type Pessoa = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  idade?: number | null;
};

export async function listarPessoas(): Promise<Pessoa[]> {
  const res = await fetch(`${BASE}/pessoas`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
