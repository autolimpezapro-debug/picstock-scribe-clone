import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  imageBase64: z.string().min(20),
  mimeType: z.string().default("image/jpeg"),
  dica: z.string().optional(),
});

export type AnaliseMaterial = {
  nome: string;
  descricao: string;
  categoria: string;
  unidade: string;
  codigo: string;
  marca: string;
  confianca: number;
  similares: string[];
};

const SYSTEM = `Você é um especialista em catalogação de materiais de almoxarifado (construção civil, elétrica, hidráulica, EPI, ferramentas, manutenção industrial).
Analise a foto do material e responda SOMENTE em JSON válido com as chaves:
{"nome": string, "descricao": string, "categoria": string, "unidade": string, "codigo": string, "marca": string, "confianca": number, "similares": string[]}
- "marca": marca/fabricante visível na embalagem ou no produto; string vazia se não houver.
Regras de padronização:
- "nome": nome técnico curto no padrão de catálogo, MAIÚSCULAS, formato "TIPO + ESPECIFICAÇÃO + MEDIDA" (ex.: "PARAFUSO SEXTAVADO AÇO ZINCADO 1/2\\" X 2\\"").
- "descricao": 1 a 2 frases objetivas com material, medidas visíveis, cor, aplicação típica.
- "categoria": uma entre Elétrica, Hidráulica, Fixação, Ferramentas, EPI, Construção, Pintura, Limpeza, Escritório, Mecânica, Outros.
- "unidade": un, pc, cx, m, kg, L, par, rolo ou pct.
- "codigo": código interno sugerido no formato "XXX-0000" usando 3 letras da categoria e 4 dígitos.
- "confianca": 0 a 100.
- "similares": até 3 nomes de produtos comerciais semelhantes que existem no mercado.
Escreva sempre em português do Brasil. Não invente medidas que não são visíveis; se não souber, omita a medida.`;

export const analisarFoto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<AnaliseMaterial> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("A inteligência artificial não está configurada.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Identifique este material de almoxarifado e devolva o JSON." +
                  (data.dica ? ` Observação do usuário: ${data.dica}` : ""),
              },
              {
                type: "image_url",
                image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Muitas análises seguidas. Aguarde alguns segundos e tente de novo.");
      if (res.status === 402) throw new Error("Os créditos de IA acabaram. Adicione créditos para continuar analisando fotos.");
      throw new Error(`Não consegui analisar a foto (${res.status}). ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const str = (v: unknown, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
    return {
      nome: str(parsed["nome"], "MATERIAL NÃO IDENTIFICADO").toUpperCase(),
      descricao: str(parsed["descricao"], "Descrição não gerada. Complete manualmente."),
      categoria: str(parsed["categoria"], "Outros"),
      unidade: str(parsed["unidade"], "un"),
      codigo: str(parsed["codigo"], ""),
      marca: str(parsed["marca"], ""),
      confianca: typeof parsed["confianca"] === "number" ? Math.max(0, Math.min(100, parsed["confianca"])) : 0,
      similares: Array.isArray(parsed["similares"])
        ? (parsed["similares"] as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 3)
        : [],
    };
  });

/* ---------- Confirmação de duplicidade (foto + descrição + código) ---------- */

const InputDup = z.object({
  imageBase64: z.string().min(20),
  mimeType: z.string().default("image/jpeg"),
  novo: z.object({
    nome: z.string(),
    descricao: z.string(),
    codigo: z.string(),
    marca: z.string().default(""),
  }),
  candidatos: z
    .array(
      z.object({
        id: z.string(),
        nome: z.string(),
        descricao: z.string(),
        codigo: z.string(),
      }),
    )
    .max(8),
});

export type ConfirmacaoDuplicidade = {
  id: string | null;
  confianca: number;
  motivo: string;
};

const SYSTEM_DUP = `Você compara um material recém-fotografado com itens já cadastrados no almoxarifado.
Responda SOMENTE JSON válido: {"id": string|null, "confianca": number, "motivo": string}.
- "id": o id do item cadastrado que é O MESMO material da foto; use null se nenhum for o mesmo.
- Considere iguais apenas materiais do mesmo tipo, mesma especificação e mesma medida. Cor ou embalagem diferente com medida diferente = materiais diferentes.
- Código interno idêntico é forte indício de que é o mesmo item.
- Compare também a MARCA/fabricante: mesma marca reforça ser o mesmo item; marcas diferentes com mesma especificação ainda podem ser o mesmo material, mas reduza a confiança.
- Quando foto, descrição, código e marca coincidirem totalmente, responda confiança 100.
- "confianca": 0 a 100 sobre ser o mesmo material.
- "motivo": uma frase curta em português do Brasil explicando a decisão.
Seja conservador: em dúvida, responda id null.`;

export const confirmarDuplicidade = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputDup.parse(data))
  .handler(async ({ data }): Promise<ConfirmacaoDuplicidade> => {
    if (!data.candidatos.length) return { id: null, confianca: 0, motivo: "Sem candidatos." };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("A inteligência artificial não está configurada.");

    const lista = data.candidatos
      .map((c) => `- id: ${c.id} | nome: ${c.nome} | código: ${c.codigo || "—"} | descrição: ${c.descricao}`)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_DUP },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Material fotografado agora:\nnome: ${data.novo.nome}\ncódigo: ${data.novo.codigo || "—"}\nmarca: ${data.novo.marca || "—"}\ndescrição: ${data.novo.descricao}\n\nItens já cadastrados:\n${lista}`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return { id: null, confianca: 0, motivo: "Não foi possível comparar com os itens existentes." };

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
    const id = typeof parsed["id"] === "string" && data.candidatos.some((c) => c.id === parsed["id"])
      ? (parsed["id"] as string)
      : null;
    const confianca =
      typeof parsed["confianca"] === "number" ? Math.max(0, Math.min(100, parsed["confianca"])) : 0;
    const motivo = typeof parsed["motivo"] === "string" ? parsed["motivo"] : "";
    return { id: confianca >= 60 ? id : null, confianca, motivo };
  });
