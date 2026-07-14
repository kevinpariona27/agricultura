import { useNavigate } from "react-router-dom";
import { Sprout, TrendingUp, BookOpen, ArrowRight, Leaf } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Nav */}
      <nav className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-primary-dark">
              Gestión Agrícola
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-primary-dark transition-colors hover:bg-primary-50"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate("/register")}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Registrarse
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-50 px-4 py-1.5 text-xs font-medium text-primary-dark">
          <Sprout className="h-4 w-4" />
          Agricultura de precisión
        </div>
        <h1 className="mx-auto mb-6 max-w-3xl text-4xl font-bold leading-tight text-primary-dark sm:text-5xl lg:text-6xl">
          Gestión Agrícola{" "}
          <span className="text-primary">Inteligente</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          Controla tus parcelas, cultivos, riegos, cosechas y costos desde un
          solo lugar. Diseñado para agricultores que quieren tomar decisiones
          basadas en datos.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-primary-dark hover:shadow-xl"
        >
          Comenzar ahora
          <ArrowRight className="h-5 w-5" />
        </button>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-3">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-primary-dark">
              Dashboard en tiempo real
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Visualiza el estado de tus cultivos, riegos, plagas e inventario
              en un panel actualizado al instante. Toda la información que
              necesitas, en un solo vistazo.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 inline-flex rounded-xl bg-accent-light p-3">
              <BookOpen className="h-7 w-7 text-accent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-primary-dark">
              Control de costos
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Registra fertilizaciones y gastos, calcula márgenes por cultivo y
              compara ingresos estimados con costos reales. Maximizá la
              rentabilidad de cada hectárea.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3">
              <Sprout className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-primary-dark">
              Cuaderno de campo digital
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Mantené un registro completo de todas tus actividades agrícolas:
              siembras, aplicaciones, cosechas. Listo para cumplir con
              normativas y auditorías.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="h-4 w-4 text-primary" />
            <span>Gestión Agrícola</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Gestión Agrícola. Todos los
            derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
