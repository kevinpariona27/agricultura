import { useState } from "react";
import { Bell, Mail, CheckCircle, AlertTriangle } from "lucide-react";
import { post } from "../../api/client";

interface AlertForm {
  email: string;
  stock_bajo: boolean;
  cosecha_proxima: boolean;
  plaga_activa: boolean;
}

export function AlertSettings() {
  const [form, setForm] = useState<AlertForm>({
    email: "",
    stock_bajo: true,
    cosecha_proxima: true,
    plaga_activa: true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await post("/alerts/subscribe", form);
      setSubmitted(true);
    } catch {
      setError("Error al guardar la suscripción. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function toggleField(field: keyof AlertForm) {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
    setSubmitted(false);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-primary-dark">
        Alertas y Notificaciones
      </h1>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-accent bg-accent-light px-5 py-4 text-sm text-accent-dark">
        <Bell className="h-5 w-5 flex-shrink-0" />
        <span>
          Configura las alertas por email para recibir notificaciones sobre el
          estado de tu explotación agrícola.
        </span>
      </div>

      {submitted && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary bg-primary-50 px-5 py-4 text-sm text-primary-dark">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
          <span>
            Suscripción guardada correctamente. Recibirás alertas en{" "}
            <strong>{form.email}</strong>.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-destructive bg-destructive-light px-5 py-4 text-sm text-destructive-dark">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        {/* Email field */}
        <div className="mb-6">
          <label
            htmlFor="alert-email"
            className="mb-2 block text-sm font-medium text-primary-dark"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="alert-email"
              type="email"
              required
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value }));
                setSubmitted(false);
              }}
              className="w-full rounded-xl border border-border bg-app-bg py-2.5 pl-10 pr-4 text-sm text-primary-dark placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Alert type toggles */}
        <div className="mb-6 space-y-4">
          <p className="text-sm font-medium text-primary-dark">
            Tipos de alerta
          </p>

          {([
            { key: "stock_bajo" as const, label: "Stock bajo de inventario", desc: "Recibe alertas cuando un insumo tenga 5 o menos unidades." },
            { key: "cosecha_proxima" as const, label: "Cosecha próxima", desc: "Recibe alertas cuando se acerque la fecha estimada de cosecha." },
            { key: "plaga_activa" as const, label: "Plaga activa", desc: "Recibe alertas cuando haya plagas activas sin controlar." },
          ]).map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-xl border border-border bg-app-bg p-4"
            >
              <button
                type="button"
                onClick={() => toggleField(key)}
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  form[key]
                    ? "border-primary bg-primary text-white"
                    : "border-border-strong bg-surface"
                }`}
              >
                {form[key] && <CheckCircle className="h-3.5 w-3.5" />}
              </button>
              <div>
                <p className="text-sm font-medium text-primary-dark">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          <Bell className="h-4 w-4" />
          {loading ? "Guardando..." : "Suscribirse a alertas"}
        </button>
      </form>
    </div>
  );
}
