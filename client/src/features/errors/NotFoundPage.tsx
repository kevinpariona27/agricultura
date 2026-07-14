import { useNavigate } from "react-router-dom";
import { Home, MapPin } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex items-center justify-center">
        <MapPin className="h-16 w-16 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-4xl font-bold text-gray-800 dark:text-gray-200">
        404
      </h1>
      <h2 className="mb-1 text-xl font-semibold text-gray-700 dark:text-gray-300">
        Página no encontrada
      </h2>
      <p className="mb-8 text-sm text-muted-foreground">
        La página que buscas no existe o fue movida.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        <Home className="h-5 w-5" />
        Volver al inicio
      </button>
    </div>
  );
}
