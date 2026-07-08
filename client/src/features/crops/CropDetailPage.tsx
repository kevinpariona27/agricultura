import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCropsStore } from "../../stores/crops.js";
import { useParcelsStore } from "../../stores/parcels.js";
import { DeleteDialog } from "../../shared/components/DeleteDialog.js";
import { CROP_STATUS_LABELS } from "./components/CropForm.js";

export function CropDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current, loading, error, fetchOne, remove, clearError } =
    useCropsStore();
  const parcels = useParcelsStore((s) => s.parcels);
  const fetchParcels = useParcelsStore((s) => s.fetchAll);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOne(Number(id));
    }
    if (parcels.length === 0) {
      fetchParcels();
    }
    return () => clearError();
  }, [id, fetchOne, clearError, parcels.length, fetchParcels]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await remove(Number(id));
      navigate("/crops");
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
        Cultivo no encontrado.
      </div>
    );
  }

  const parcelName =
    parcels.find((p) => p.id === current.parcel_id)?.name ??
    `Lote #${current.parcel_id}`;

  const statusLabel =
    CROP_STATUS_LABELS[current.status as keyof typeof CROP_STATUS_LABELS] ??
    current.status;

  const fields = [
    { label: "Variedad", value: current.variety },
    { label: "Parcela", value: parcelName },
    { label: "Estado", value: statusLabel },
    {
      label: "Fecha de siembra",
      value: new Date(current.planting_date).toLocaleDateString("es-AR"),
    },
    ...(current.estimated_harvest_date
      ? [
          {
            label: "Fecha estimada de cosecha",
            value: new Date(
              current.estimated_harvest_date
            ).toLocaleDateString("es-AR"),
          },
        ]
      : []),
    ...(current.planting_density != null
      ? [
          {
            label: "Densidad de siembra (plantas/ha)",
            value: current.planting_density.toLocaleString(),
          },
        ]
      : []),
    ...(current.notes
      ? [{ label: "Notas", value: current.notes }]
      : []),
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
        onClick={() => navigate("/crops")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{current.variety}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/crops/${current.id}/edit`)}
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
        title="¿Eliminar este cultivo?"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
