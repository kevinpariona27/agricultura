import type { Inventory } from "@agri/shared";

const CATEGORIA_LABELS: Record<string, string> = {
  fertilizante: "Fertilizante",
  pesticida: "Pesticida",
  semilla: "Semilla",
  herramienta: "Herramienta",
  otro: "Otro",
};

const UNIDAD_LABELS: Record<string, string> = {
  kg: "kg",
  L: "L",
  unidad: "unidad",
  bolsa: "bolsa",
};

interface InventoryTableProps {
  items: Inventory[];
  onSearch: (search: string) => void;
  onCategoriaFilter: (categoria: string) => void;
}

export function InventoryTable({
  items,
  onSearch,
  onCategoriaFilter,
}: InventoryTableProps) {
  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="search"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Buscar por nombre
          </label>
          <input
            id="search"
            type="text"
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar ítem..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div className="min-w-[200px]">
          <label
            htmlFor="categoria-filter"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Categoría
          </label>
          <select
            id="categoria-filter"
            onChange={(e) => onCategoriaFilter(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todas</option>
            <option value="fertilizante">Fertilizante</option>
            <option value="pesticida">Pesticida</option>
            <option value="semilla">Semilla</option>
            <option value="herramienta">Herramienta</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
          No se encontraron ítems de inventario.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Unidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer transition-colors hover:bg-green-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.nombre}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {CATEGORIA_LABELS[item.categoria] ?? item.categoria}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.cantidad}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {UNIDAD_LABELS[item.unidad] ?? item.unidad}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
