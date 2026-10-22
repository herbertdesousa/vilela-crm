export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 p-8 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">Vilela Climatização</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        Orçamentos e recibos gerados por WhatsApp. Essa página pública não tem conteúdo próprio —
        os documentos ficam em <code className="font-mono">/d/[id]</code>.
      </p>
    </div>
  );
}
