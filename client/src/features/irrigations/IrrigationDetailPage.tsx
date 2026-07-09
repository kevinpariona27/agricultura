import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIrrigationsStore } from "../../stores/irrigations";
import { useCropsStore } from "../../stores/crops";
import { DeleteDialog } from "../../shared/components/DeleteDialog";
import { IRRIGATION_METHOD_LABELS } from "./components/IrrigationForm";

export function IrrigationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current, loading, error, fetchOne, remove, clearError } =
    useIrrigationsStore();
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
      navigate("/irrigations");
    } catch {
      setDeleting(false);
    }
  }

  if (loading && !current) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
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
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
        Riego no encontrado.
      </div>
    );
  }

  const cropVariety =
    crops.find((c) => c.id === current.crop_id)?.variety ??
    `Cultivo #${current.crop_id}`;

  const methodLabel =
    IRRIGATION_METHOD_LABELS[
      current.method as keyof typeof IRRIGATION_METHOD_LABELS
    ] ?? current.method;

  const fields = [
    { label: "Cultivo", value: cropVariety },
    {
      label: "Fecha",
      value: new Date(current.irrigation_date).toLocaleDateString("es-AR"),
    },
    { label: "Cantidad (L)", value: current.amount.toLocaleString() },
    { label: "Método", value: methodLabel },
    ...(current.duration != null
      ? [{ label: "Duración", value: `${current.duration} min` }]
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
        onClick={() => navigate("/irrigations")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Riego del{" "}
          {new Date(current.irrigation_date).toLocaleDateString("es-AR")}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/irrigations/${current.id}/edit`)}
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

      <div className="rounded-xl border border-gray-100 bg-white">
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
        title="¿Eliminar este riego?"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
