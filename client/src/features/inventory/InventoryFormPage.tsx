import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInventoryStore } from "../../stores/inventory";
import {
  InventoryForm,
  type InventoryFormData,
} from "./components/InventoryForm";

export function InventoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { current, loading, error, fetchOne, create, update, clearError } =
    useInventoryStore();

  useEffect(() => {
    if (isEdit && id) {
      fetchOne(Number(id));
    }
    return () => clearError();
  }, [id, isEdit, fetchOne, clearError]);

  async function handleCreate(data: InventoryFormData) {
    await create(data);
    navigate("/inventory");
  }

  async function handleUpdate(data: InventoryFormData) {
    await update(Number(id), data);
    navigate("/inventory");
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
        Ítem no encontrado.
      </div>
    );
  }

  const initialValues = current
    ? {
        nombre: current.nombre,
        categoria: current.categoria,
        cantidad: current.cantidad,
        unidad: current.unidad,
        fecha_adquisicion: current.fecha_adquisicion ?? "",
        fecha_vencimiento: current.fecha_vencimiento ?? "",
        costo_unitario: current.costo_unitario,
        notas: current.notas ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => navigate("/inventory")}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver a la lista
      </button>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">
        {isEdit ? "Editar ítem" : "Nuevo ítem"}
      </h1>

      <InventoryForm
        initialValues={initialValues}
        onSubmit={isEdit ? handleUpdate : handleCreate}
        submitLabel={isEdit ? "Guardar cambios" : "Crear ítem"}
        loading={loading}
      />
    </div>
  );
}
