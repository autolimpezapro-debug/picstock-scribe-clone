import { ImageOff } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ItemComFoto } from "@/lib/inventario";

type Props = {
  item: ItemComFoto | null;
  onFechar: () => void;
};

export function FotoDialog({ item, onFechar }: Props) {
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
                  {item.quantidade} {item.unidade} em estoque
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center bg-black/40 p-2">
              {item.fotoSrc ? (
                <img
                  src={item.fotoSrc}
                  alt={item.nome}
                  className="max-h-[60dvh] w-auto max-w-full rounded-md object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                  <ImageOff className="size-10" />
                  <span className="text-sm">Sem foto cadastrada</span>
                </div>
              )}
            </div>

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
