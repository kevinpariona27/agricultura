import { useEffect, useState } from "react";
import { useUserStore } from "../../stores/user";
import type { UserRole } from "@agri/shared";

export function ProfilePage() {
  const { profile, loading, error, fetchProfile, updateProfile, clearError } =
    useUserStore();
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<UserRole>("operador");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchProfile();
    return () => clearError();
  }, [fetchProfile, clearError]);

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre ?? "");
      setRol(profile.rol as UserRole);
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      await updateProfile({ nombre: nombre || undefined, rol });
      setSuccessMsg("Perfil actualizado correctamente");
    } catch {
      // error is set by store
    } finally {
      setSaving(false);
    }
  }

  if (loading && !profile) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
        Cargando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">Perfil</h1>

      {successMsg && (
        <div className="mb-4 rounded bg-green-50 px-4 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {profile && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email — read-only */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as UserRole)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="operador">Operador</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Fecha de registro — read-only */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Fecha de registro
            </label>
            <input
              type="text"
              value={new Date(profile.fecha_registro).toLocaleDateString()}
              disabled
              className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      )}
    </div>
  );
}
