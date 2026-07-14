import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCropsStore } from "../../stores/crops.js";
import { CropForm, type CropFormData } from "./components/CropForm.js";

export function CropFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { current, loading, error, fetchOne, create, update, clearError } =
    useCropsStore();
  const [createdId, setCreatedId] = useState<number | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      fetchOne(Number(id));
    }
    return () => clearError();
  }, [id, isEdit, fetchOne, clearError]);

  async function handleCreate(data: CropFormData) {
    const crop = await create(data);
    setCreatedId(crop.id);
  }

  async function handleUpdate(data: CropFormData) {
    await update(Number(id), data);
    navigate("/crops");
  }

  if (isEdit && loading && !current) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
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
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
        Cultivo no encontrado.
      </div>
    );
  }

  const initialValues = current
    ? {
        parcel_id: current.parcel_id,
        variety: current.variety,
        planting_date: current.planting_date,
        status: current.status,
        estimated_harvest_date: current.estimated_harvest_date ?? "",
        planting_density: current.planting_density ?? undefined,
        notes: current.notes ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => navigate("/crops")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">
        {isEdit ? "Editar cultivo" : "Nuevo cultivo"}
      </h1>

      {!isEdit && createdId && (
        <div className="mt-6 rounded-lg border border-border bg-primary-50 p-4 text-sm text-primary-dark">
          ✅ Cultivo creado correctamente.{" "}
          <button onClick={() => navigate("/crops")} className="font-medium underline hover:text-primary">
            Volver a la lista
          </button>
        </div>
      )}

      {isEdit && !createdId && (
        <CropForm
          initialValues={initialValues}
          onSubmit={isEdit ? handleUpdate : handleCreate}
          submitLabel={isEdit ? "Guardar cambios" : "Crear cultivo"}
          loading={loading}
        />
      )}

      {!isEdit && !createdId && (
        <CropForm
          initialValues={initialValues}
          onSubmit={handleCreate}
          submitLabel="Crear cultivo"
          loading={loading}
        />
      )}
    </div>
  );
}
