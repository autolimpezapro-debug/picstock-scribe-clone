import { Minus, Plus, Pencil, Trash2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ItemComFoto } from "@/lib/inventario";

type Props = {
  item: ItemComFoto;
  onAjustar: (item: ItemComFoto, delta: number) => void;
  onEditar: (item: ItemComFoto) => void;
  onExcluir: (item: ItemComFoto) => void;
  onVerFoto: (item: ItemComFoto) => void;
};

export function ItemCard({ item, onAjustar, onEditar, onExcluir, onVerFoto }: Props) {
  const semEstoque = item.quantidade <= 0;
  const baixo = !semEstoque && item.quantidade <= item.estoque_minimo;

  return (
    <div className="superficie flex gap-3 rounded-lg p-3">
      <button
        type="button"
        onClick={() => onVerFoto(item)}
        aria-label={`Ver foto e detalhes de ${item.nome}`}
        className="size-20 shrink-0 overflow-hidden rounded-md bg-muted ring-offset-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {item.fotoSrc ? (
          <div className="relative size-full">
            <img
              src={item.fotoSrc}
              alt={item.nome}
              loading="lazy"
              width={160}
              height={160}
              className="size-full object-cover"
            />
            {item.fotoSrcs?.length > 1 ? (
              <span className="absolute bottom-0.5 right-0.5 rounded bg-background/85 px-1 text-[10px] font-medium">
                {item.fotoSrcs.length} fotos
              </span>
            ) : null}
          </div>
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="truncate cursor-pointer text-sm font-semibold uppercase"
            onClick={() => onVerFoto(item)}
          >
            {item.nome}
          </h3>
          {semEstoque ? (
            <Badge variant="destructive">Sem estoque</Badge>
          ) : baixo ? (
            <Badge className="bg-warning text-primary-foreground">Baixo</Badge>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.descricao}</p>
        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
          {item.codigo ? <span className="rounded bg-secondary px-1.5 py-0.5">{item.codigo}</span> : null}
          {item.categoria ? <span className="rounded bg-secondary px-1.5 py-0.5">{item.categoria}</span> : null}
          {item.localizacao ? (
            <span className="rounded bg-secondary px-1.5 py-0.5">{item.localizacao}</span>
          ) : null}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Button size="icon" variant="secondary" className="size-8" onClick={() => onAjustar(item, -1)}>
            <Minus className="size-4" />
          </Button>
          <span className="min-w-[70px] text-center text-sm font-semibold tabular-nums">
            {item.quantidade} {item.unidade}
          </span>
          <Button size="icon" variant="secondary" className="size-8" onClick={() => onAjustar(item, 1)}>
            <Plus className="size-4" />
          </Button>
          <div className="ml-auto flex gap-1">
            <Button size="icon" variant="ghost" className="size-8" onClick={() => onEditar(item)}>
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => onExcluir(item)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
