import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIrrigationsStore } from "../../stores/irrigations";
import {
  IrrigationForm,
  type IrrigationFormData,
} from "./components/IrrigationForm";

export function IrrigationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { current, loading, error, fetchOne, create, update, clearError } =
    useIrrigationsStore();

  useEffect(() => {
    if (isEdit && id) {
      fetchOne(Number(id));
    }
    return () => clearError();
  }, [id, isEdit, fetchOne, clearError]);

  async function handleCreate(data: IrrigationFormData) {
    await create(data);
    navigate("/irrigations");
  }

  async function handleUpdate(data: IrrigationFormData) {
    await update(Number(id), data);
    navigate("/irrigations");
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
        Riego no encontrado.
      </div>
    );
  }

  const initialValues = current
    ? {
        crop_id: current.crop_id,
        amount: current.amount,
        irrigation_date: current.irrigation_date,
        method: current.method,
        duration: current.duration,
        notes: current.notes ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => navigate("/irrigations")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">
        {isEdit ? "Editar riego" : "Nuevo riego"}
      </h1>

      <IrrigationForm
        initialValues={initialValues}
        onSubmit={isEdit ? handleUpdate : handleCreate}
        submitLabel={isEdit ? "Guardar cambios" : "Crear riego"}
        loading={loading}
      />
    </div>
  );
}
