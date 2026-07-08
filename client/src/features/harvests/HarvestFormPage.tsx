import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHarvestsStore } from "../../stores/harvests";
import {
  HarvestForm,
  type HarvestFormData,
} from "./components/HarvestForm";

export function HarvestFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { current, loading, error, fetchOne, create, update, clearError } =
    useHarvestsStore();

  useEffect(() => {
    if (isEdit && id) {
      fetchOne(Number(id));
    }
    return () => clearError();
  }, [id, isEdit, fetchOne, clearError]);

  async function handleCreate(data: HarvestFormData) {
    await create(data);
    navigate("/harvests");
  }

  async function handleUpdate(data: HarvestFormData) {
    await update(Number(id), data);
    navigate("/harvests");
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
        Cosecha no encontrada.
      </div>
    );
  }

  const initialValues = current
    ? {
        crop_id: current.crop_id,
        cantidad: current.cantidad,
        unidad: current.unidad,
        fecha_cosecha: current.fecha_cosecha,
        rendimiento: current.rendimiento,
        perdidas: current.perdidas,
        notas: current.notas ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => navigate("/harvests")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEdit ? "Editar cosecha" : "Nueva cosecha"}
      </h1>

      <HarvestForm
        initialValues={initialValues}
        onSubmit={isEdit ? handleUpdate : handleCreate}
        submitLabel={isEdit ? "Guardar cambios" : "Crear cosecha"}
        loading={loading}
      />
    </div>
  );
}
