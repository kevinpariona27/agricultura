import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFertilizationsStore } from "../../stores/fertilizations";
import { useCropsStore } from "../../stores/crops";
import { DeleteDialog } from "../../shared/components/DeleteDialog";

const UNIT_LABELS: Record<string, string> = {
  "kg/ha": "kg/ha",
  "L/ha": "L/ha",
};

export function FertilizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current, loading, error, fetchOne, remove, clearError } =
    useFertilizationsStore();
  const crops = useCropsStore((s) => s.crops);
  const fetchCrops = useCropsStore((s) => s.fetchAll);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOne(Number(id));
    }
    if (crops.length === 0) {
      fetchCrops();
    }
    return () => clearError();
  }, [id, fetchOne, clearError, crops.length, fetchCrops]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await remove(Number(id));
      navigate("/fertilizations");
    } catch {
      setDeleting(false);
    }
  }

  if (loading && !current) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
        Fertilización no encontrada.
      </div>
    );
  }

  const cropVariety =
    crops.find((c) => c.id === current.crop_id)?.variety ??
    `Cultivo #${current.crop_id}`;

  const fields = [
    { label: "Cultivo", value: cropVariety },
    { label: "Producto", value: current.producto },
    {
      label: "Dosis",
      value: `${current.dosis} ${UNIT_LABELS[current.unidad] ?? current.unidad}`,
    },
    {
      label: "Fecha de aplicación",
      value: new Date(current.fecha_aplicacion).toLocaleDateString("es-AR"),
    },
    ...(current.costo != null
      ? [
          {
            label: "Costo",
            value: `$${current.costo.toLocaleString("es-AR")}`,
          },
        ]
      : []),
    ...(current.notas ? [{ label: "Notas", value: current.notas }] : []),
    {
      label: "Creado",
      value: new Date(current.created_at).toLocaleDateString("es-AR"),
    },
    {
      label: "Actualizado",
      value: new Date(current.updated_at).toLocaleDateString("es-AR"),
    },
  ];

  return (
    <div>
      <button
        onClick={() => navigate("/fertilizations")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Fertilización {current.producto}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/fertilizations/${current.id}/edit`)}
            className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            Editar
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <dl className="divide-y divide-gray-100">
          {fields.map(({ label, value }) => (
            <div
              key={label}
              className="flex gap-4 px-6 py-4 sm:flex-row flex-col"
            >
              <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">
                {label}
              </dt>
              <dd className="text-sm text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <DeleteDialog
        open={showDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={deleting}
        title="¿Eliminar esta fertilización?"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
