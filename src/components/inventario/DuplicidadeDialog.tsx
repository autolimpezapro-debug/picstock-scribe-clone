import { useEffect, useState } from "react";
import { ImageOff, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ItemComFoto } from "@/lib/inventario";

type Props = {
  item: ItemComFoto | null;
  fotoNova: string | null;
  motivo?: string;
  confianca?: number;
  salvando?: boolean;
  onConfirmar: (novaQuantidade: number) => void;
  onCadastrarNovo: () => void;
  onFechar: () => void;
};

export function DuplicidadeDialog({
  item,
  fotoNova,
  motivo,
  confianca,
  salvando,
  onConfirmar,
  onCadastrarNovo,
  onFechar,
}: Props) {
  const [adicionar, setAdicionar] = useState(1);
  useEffect(() => {
    if (item) setAdicionar(1);
  }, [item]);

  const atual = item ? Number(item.quantidade) : 0;
  const total = Math.max(0, atual + Number(adicionar || 0));

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {item ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TriangleAlert className="size-5 text-warning" />
                Este material já foi conferido
              </DialogTitle>
              <DialogDescription>
                Encontrei este item já cadastrado no inventário. Ajuste a quantidade em vez de cadastrar
                de novo.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2">
              <Foto src={fotoNova} rotulo="Foto de agora" />
              <Foto src={item.fotoSrc} rotulo="Já cadastrado" />
            </div>

            <div className="superficie rounded-lg p-3">
              <p className="text-sm font-semibold uppercase">{item.nome}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {item.codigo ? <Badge variant="secondary">{item.codigo}</Badge> : null}
                {item.categoria ? <Badge variant="secondary">{item.categoria}</Badge> : null}
                {item.localizacao ? <Badge variant="secondary">{item.localizacao}</Badge> : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{item.descricao}</p>
              <p className="mt-2 text-xs">
                Em estoque hoje:{" "}
                <strong className="tabular-nums">
                  {atual} {item.unidade}
                </strong>
              </p>
              {motivo ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {motivo}
                  {typeof confianca === "number" && confianca > 0 ? ` (${confianca}% de certeza)` : ""}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label>Quantidade contada agora (some ou subtraia)</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setAdicionar((a) => Number(a) - 1)}
                >
                  −
                </Button>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={adicionar}
                  onChange={(e) => setAdicionar(Number(e.target.value))}
                  className="text-center"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setAdicionar((a) => Number(a) + 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Novo total:{" "}
                <strong className="tabular-nums">
                  {total} {item.unidade}
                </strong>
              </p>
            </div>

            <DialogFooter className="gap-2 sm:flex-col">
              <Button disabled={salvando} onClick={() => onConfirmar(total)}>
                {salvando ? "Salvando..." : `Ajustar para ${total} ${item.unidade}`}
              </Button>
              <Button variant="ghost" disabled={salvando} onClick={onCadastrarNovo}>
                É outro material — cadastrar como novo
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Foto({ src, rotulo }: { src: string | null; rotulo: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase text-muted-foreground">{rotulo}</p>
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-md bg-muted">
        {src ? (
          <img src={src} alt={rotulo} className="size-full object-cover" />
        ) : (
          <ImageOff className="size-6 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
