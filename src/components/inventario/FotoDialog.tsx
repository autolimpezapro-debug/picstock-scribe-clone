import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ItemComFoto } from "@/lib/inventario";

type Props = {
  item: ItemComFoto | null;
  onFechar: () => void;
};

export function FotoDialog({ item, onFechar }: Props) {
  const [indice, setIndice] = useState(0);
  const fotos = useMemo(() => item?.fotoSrcs?.filter(Boolean) ?? [], [item]);
  const fotoAtual = fotos[indice] ?? null;

  useEffect(() => {
    if (item) setIndice(0);
  }, [item]);

  const navegar = (delta: number) => {
    if (!fotos.length) return;
    setIndice((atual) => (atual + delta + fotos.length) % fotos.length);
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="left-0 top-0 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 p-0 backdrop-blur sm:max-w-none">
        {item ? (
          <div className="flex h-[100dvh] flex-col overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 pr-12">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold uppercase leading-snug">
                  {item.nome}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {item.quantidade} {item.unidade} em estoque · {fotos.length || 0}/3 fotos
                </p>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center bg-secondary p-2">
              {fotoAtual ? (
                <>
                  <img
                    src={fotoAtual}
                    alt={`${item.nome} — foto ${indice + 1}`}
                    className="max-h-[64dvh] w-auto max-w-full rounded-md object-contain"
                  />
                  {fotos.length > 1 ? (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute left-3 top-1/2 size-10 -translate-y-1/2"
                        aria-label="Foto anterior"
                        onClick={() => navegar(-1)}
                      >
                        <ChevronLeft className="size-5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute right-3 top-1/2 size-10 -translate-y-1/2"
                        aria-label="Próxima foto"
                        onClick={() => navegar(1)}
                      >
                        <ChevronRight className="size-5" />
                      </Button>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                  <ImageOff className="size-10" />
                  <span className="text-sm">Sem foto cadastrada</span>
                </div>
              )}
            </div>

            {fotos.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3">
                {fotos.map((foto, i) => (
                  <Button
                    key={foto}
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Ampliar foto ${i + 1}`}
                    onClick={() => setIndice(i)}
                    className="size-16 shrink-0 overflow-hidden rounded-md bg-muted p-0 ring-offset-background data-[ativo=true]:ring-2 data-[ativo=true]:ring-primary"
                    data-ativo={i === indice}
                  >
                    <img src={foto} alt={`${item.nome} miniatura ${i + 1}`} className="size-full object-cover" />
                  </Button>
                ))}
              </div>
            ) : null}

            <div className="space-y-3 px-4 py-4">
              <div className="flex flex-wrap gap-1.5">
                {item.codigo ? <Badge variant="secondary">{item.codigo}</Badge> : null}
                {item.categoria ? <Badge variant="secondary">{item.categoria}</Badge> : null}
                {item.localizacao ? <Badge variant="secondary">{item.localizacao}</Badge> : null}
                {item.quantidade <= 0 ? (
                  <Badge variant="destructive">Sem estoque</Badge>
                ) : item.quantidade <= item.estoque_minimo ? (
                  <Badge className="bg-warning text-primary-foreground">Estoque baixo</Badge>
                ) : null}
              </div>

              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {item.descricao || "Sem descrição cadastrada."}
              </p>

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <Linha rotulo="Quantidade" valor={`${item.quantidade} ${item.unidade}`} />
                <Linha rotulo="Estoque mínimo" valor={`${item.estoque_minimo} ${item.unidade}`} />
                <Linha rotulo="Categoria" valor={item.categoria || "—"} />
                <Linha rotulo="Localização" valor={item.localizacao || "—"} />
                <Linha rotulo="Código" valor={item.codigo || "—"} />
                <Linha
                  rotulo="Cadastrado em"
                  valor={new Date(item.created_at).toLocaleDateString("pt-BR")}
                />
              </dl>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="superficie rounded-md px-2.5 py-1.5">
      <dt className="text-[11px] uppercase text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}
