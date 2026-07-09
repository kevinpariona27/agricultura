import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFertilizationsStore } from "../../stores/fertilizations";
import {
  FertilizationForm,
  type FertilizationFormData,
} from "./components/FertilizationForm";

export function FertilizationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { current, loading, error, fetchOne, create, update, clearError } =
    useFertilizationsStore();

  useEffect(() => {
    if (isEdit && id) {
      fetchOne(Number(id));
    }
    return () => clearError();
  }, [id, isEdit, fetchOne, clearError]);

  async function handleCreate(data: FertilizationFormData) {
    await create(data);
    navigate("/fertilizations");
  }

  async function handleUpdate(data: FertilizationFormData) {
    await update(Number(id), data);
    navigate("/fertilizations");
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
        Fertilización no encontrada.
      </div>
    );
  }

  const initialValues = current
    ? {
        crop_id: current.crop_id,
        producto: current.producto,
        dosis: current.dosis,
        unidad: current.unidad,
        fecha_aplicacion: current.fecha_aplicacion,
        costo: current.costo ?? undefined,
        notas: current.notas ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => navigate("/fertilizations")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">
        {isEdit ? "Editar fertilización" : "Nueva fertilización"}
      </h1>

      <FertilizationForm
        initialValues={initialValues}
        onSubmit={isEdit ? handleUpdate : handleCreate}
        submitLabel={isEdit ? "Guardar cambios" : "Crear fertilización"}
        loading={loading}
      />
    </div>
  );
}
