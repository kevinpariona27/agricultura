import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useParcelsStore } from "../../stores/parcels.js";
import { ParcelForm, type ParcelFormData } from "./components/ParcelForm.js";

export function ParcelFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { current, loading, error, fetchOne, create, update, clearError } =
    useParcelsStore();

  useEffect(() => {
    if (isEdit && id) {
      fetchOne(Number(id));
    }
    return () => clearError();
  }, [id, isEdit, fetchOne, clearError]);

  async function handleCreate(data: ParcelFormData) {
    await create(data);
    navigate("/parcels");
  }

  async function handleUpdate(data: ParcelFormData) {
    await update(Number(id), data);
    navigate("/parcels");
  }

  if (isEdit && loading && !current) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
        Cargando...
      </div>
    );
  }

  if (isEdit && error && !current) {
    return (
      <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (isEdit && !current) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
        Lote no encontrado.
      </div>
    );
  }

  const initialValues = current
    ? {
        name: current.name,
        area: current.area,
        location: current.location,
        soil_type: current.soil_type,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => navigate("/parcels")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEdit ? "Editar parcela" : "Nueva parcela"}
      </h1>

      <ParcelForm
        initialValues={initialValues}
        onSubmit={isEdit ? handleUpdate : handleCreate}
        submitLabel={isEdit ? "Guardar cambios" : "Crear parcela"}
        loading={loading}
      />
    </div>
  );
}
