type Props = { tipo?: "sucesso" | "erro" | "info"; texto: string };
export default function Banner({ tipo = "info", texto }: Props) {
  const map = {
    sucesso: "bg-green-50 text-green-700 border-green-200",
    erro: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  } as const;
  return (
    <div className={`mb-4 rounded-lg border px-4 py-2 ${map[tipo]}`}>
      {texto}
    </div>
  );
}
