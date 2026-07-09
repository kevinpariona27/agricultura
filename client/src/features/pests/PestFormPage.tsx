import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePestsStore } from "../../stores/pests";
import { PestForm, type PestFormData } from "./components/PestForm";

export function PestFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { current, loading, error, fetchOne, create, update, clearError } =
    usePestsStore();

  useEffect(() => {
    if (isEdit && id) {
      fetchOne(Number(id));
    }
    return () => clearError();
  }, [id, isEdit, fetchOne, clearError]);

  async function handleCreate(data: PestFormData) {
    await create(data);
    navigate("/pests");
  }

  async function handleUpdate(data: PestFormData) {
    await update(Number(id), data);
    navigate("/pests");
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
        Plaga no encontrada.
      </div>
    );
  }

  const initialValues = current
    ? {
        crop_id: current.crop_id,
        tipo: current.tipo,
        nombre: current.nombre,
        severidad: current.severidad,
        fecha_deteccion: current.fecha_deteccion,
        estado: current.estado,
        tratamiento: current.tratamiento ?? "",
        notas: current.notas ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => navigate("/pests")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">
        {isEdit ? "Editar plaga" : "Nueva plaga"}
      </h1>

      <PestForm
        initialValues={initialValues}
        onSubmit={isEdit ? handleUpdate : handleCreate}
        submitLabel={isEdit ? "Guardar cambios" : "Crear plaga"}
        loading={loading}
      />
    </div>
  );
}
