import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useParcelsStore } from "../../stores/parcels.js";
import { DeleteDialog } from "../../shared/components/DeleteDialog.js";
import { ImageDisplay } from "../../shared/components/ImageDisplay.js";

export function ParcelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current, loading, error, fetchOne, remove, clearError } =
    useParcelsStore();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOne(Number(id));
    }
    return () => clearError();
  }, [id, fetchOne, clearError]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await remove(Number(id));
      navigate("/parcels");
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
        Lote no encontrado.
      </div>
    );
  }

  const fields = [
    { label: "Nombre", value: current.name },
    { label: "Área (hectáreas)", value: current.area.toString() },
    { label: "Ubicación", value: current.location },
    { label: "Tipo de suelo", value: current.soil_type },
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
        onClick={() => navigate("/parcels")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{current.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/parcels/${current.id}/edit`)}
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
        <div className="flex justify-center py-6">
          <ImageDisplay
            src={current.image_url ?? null}
            alt={current.name}
            size="lg"
            rounded
            fallbackIcon={MapPin}
          />
        </div>
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
        title="¿Eliminar este lote?"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
