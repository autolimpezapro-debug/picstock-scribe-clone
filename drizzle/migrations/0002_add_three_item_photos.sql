ALTER TABLE public.itens
  ADD COLUMN IF NOT EXISTS foto_urls text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.itens
SET foto_urls = CASE
  WHEN foto_url IS NOT NULL AND foto_url <> '' THEN ARRAY[foto_url]
  ELSE '{}'::text[]
END
WHERE foto_urls = '{}'::text[];

ALTER TABLE public.itens
  ADD CONSTRAINT itens_foto_urls_max_3 CHECK (cardinality(foto_urls) <= 3);

COMMENT ON COLUMN public.itens.foto_urls IS 'Até 3 caminhos de fotos do item no bucket fotos-materiais. foto_url foi mantida para compatibilidade.';