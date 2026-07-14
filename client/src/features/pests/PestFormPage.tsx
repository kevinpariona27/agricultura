import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePestsStore } from "../../stores/pests";
import { PestForm, type PestFormData } from "./components/PestForm";
import { ImageUpload } from "../../shared/components/ImageUpload";

export function PestFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { current, loading, error, fetchOne, create, update, uploadImage, removeImage, clearError } =
    usePestsStore();
  const [createdId, setCreatedId] = useState<number | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      fetchOne(Number(id));
    }
    return () => clearError();
  }, [id, isEdit, fetchOne, clearError]);

  async function handleCreate(data: PestFormData) {
    const pest = await create(data);
    setCreatedId(pest.id);
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

      {!isEdit && createdId && (
        <div className="mt-6 rounded-lg border border-border bg-primary-50 p-4 text-sm text-primary-dark">
          ✅ Plaga creada correctamente.{" "}
          <button onClick={() => navigate("/pests")} className="font-medium underline hover:text-primary">
            Volver a la lista
          </button>
        </div>
      )}

      {isEdit && !createdId && (
        <PestForm
          initialValues={initialValues}
          onSubmit={isEdit ? handleUpdate : handleCreate}
          submitLabel={isEdit ? "Guardar cambios" : "Crear plaga"}
          loading={loading}
        />
      )}

      {!isEdit && !createdId && (
        <PestForm
          initialValues={initialValues}
          onSubmit={handleCreate}
          submitLabel="Crear plaga"
          loading={loading}
        />
      )}

      {(isEdit && id) || createdId ? (
        <div className="mt-6">
          <ImageUpload
            currentImage={current?.image_url ?? null}
            onUpload={(file) => uploadImage(Number(isEdit ? id : createdId), file)}
            onRemove={() => removeImage(Number(isEdit ? id : createdId))}
            entityLabel="Foto de la plaga"
          />
        </div>
      ) : null}
    </div>
  );
}
