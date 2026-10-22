import type { ExtractedDocument } from "../schema";

function formatCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function DocumentView({ data }: { data: ExtractedDocument }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-baseline justify-between border-b border-zinc-200 pb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {data.type === "quote" ? "Orçamento" : "Recibo"}
          </p>
          <h1 className="text-lg font-semibold text-zinc-900">Vilela Climatização</h1>
        </div>
      </div>

      <div className="mt-4 text-sm text-zinc-700">
        <p>
          <span className="font-medium">Cliente:</span> {data.customerName ?? "—"}
        </p>
        <p>
          <span className="font-medium">Endereço:</span> {data.address ?? "—"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {data.items.map((item, i) => (
          <div key={i} className="rounded border border-zinc-200 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium text-zinc-900">{item.title}</h2>
              <span className="font-medium text-zinc-900">{formatCurrency(item.value)}</span>
            </div>
            {item.location && <p className="mt-1 text-sm text-zinc-500">{item.location}</p>}
            {item.description && (
              <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">
                {item.description}
              </p>
            )}
            {item.equipment.length > 0 && (
              <p className="mt-2 text-sm text-zinc-600">
                <span className="font-medium">Equipamentos:</span> {item.equipment.join(", ")}
              </p>
            )}
            {item.materials.length > 0 && (
              <p className="mt-1 text-sm text-zinc-600">
                <span className="font-medium">Materiais:</span> {item.materials.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end border-t border-zinc-200 pt-4">
        <p className="text-base font-semibold text-zinc-900">
          Total: {formatCurrency(data.totalValue)}
        </p>
      </div>
    </div>
  );
}
