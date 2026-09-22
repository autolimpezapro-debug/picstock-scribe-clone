const STOP = new Set(["de", "da", "do", "para", "com", "em", "e", "a", "o", "the", "of"]);

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s./"-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(texto: string): Set<string> {
  return new Set(
    normalizar(texto)
      .split(/[\s/]+/)
      .filter((t) => t.length > 1 && !STOP.has(t)),
  );
}

/** 0 a 1 — proporção de palavras em comum (Jaccard ponderado pelo menor conjunto). */
export function semelhanca(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let comuns = 0;
  ta.forEach((t) => {
    if (tb.has(t)) comuns += 1;
  });
  return comuns / Math.min(ta.size, tb.size);
}

export type Candidato = {
  id: string;
  nome: string;
  descricao: string;
  codigo: string;
  pontuacao: number;
};

/** Pré-seleciona itens do inventário parecidos com o material recém-fotografado. */
export function candidatosDuplicidade<
  T extends { id: string; nome: string; descricao: string | null; codigo: string | null },
>(
  itens: T[],
  novo: { nome: string; descricao: string; codigo: string; marca?: string },
  limite = 8,
): Candidato[] {
  const codigoNovo = normalizar(novo.codigo);
  const marcaNova = normalizar(novo.marca ?? "");
  return itens
    .map((i) => {
      const nome = semelhanca(novo.nome, i.nome);
      const descricao = semelhanca(novo.descricao, i.descricao ?? "");
      const textoItem = normalizar(`${i.nome} ${i.descricao ?? ""}`);
      const marcaIgual = !!marcaNova && textoItem.includes(marcaNova);
      const codigoIgual = !!codigoNovo && normalizar(i.codigo ?? "") === codigoNovo;
      const base = nome * 0.65 + descricao * 0.25 + (marcaIgual ? 0.1 : 0);
      const pontuacao = codigoIgual ? 1 : Math.min(1, base);
      return {
        id: i.id,
        nome: i.nome,
        descricao: i.descricao ?? "",
        codigo: i.codigo ?? "",
        pontuacao,
      };
    })
    .filter((c) => c.pontuacao >= 0.3)
    .sort((a, b) => b.pontuacao - a.pontuacao)
    .slice(0, limite);
}
