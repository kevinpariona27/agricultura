import { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, momentLocalizer, type Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useCropsStore } from "../../stores/crops";
import { useIrrigationsStore } from "../../stores/irrigations";
import { useHarvestsStore } from "../../stores/harvests";
import { useFertilizationsStore } from "../../stores/fertilizations";
import { Sprout, Droplets, Pizza, FlaskConical, X } from "lucide-react";

moment.locale("es");
const localizer = momentLocalizer(moment);

interface CalendarEvent extends Event {
  resource?: {
    type: "crop" | "irrigation" | "harvest" | "fertilization";
    entityId: number;
  };
}

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  crop: { bg: "#F0FDF4", border: "#15803D", text: "#0F2E1A" },
  irrigation: { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" },
  harvest: { bg: "#FEF3C7", border: "#B8860B", text: "#92400E" },
  fertilization: { bg: "#F3E8FF", border: "#7C3AED", text: "#5B21B6" },
};

function colorFor(type: string) {
  return EVENT_COLORS[type] ?? { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" };
}

export function CalendarPage() {
  const { crops, fetchAll: fetchCrops, loading: loadingCrops } = useCropsStore();
  const { irrigations, fetchAll: fetchIrrigations, loading: loadingIrrig } = useIrrigationsStore();
  const { harvests, fetchAll: fetchHarvests, loading: loadingHarv } = useHarvestsStore();
  const { fertilizations, fetchAll: fetchFerts, loading: loadingFerts } = useFertilizationsStore();

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchCrops();
    fetchIrrigations();
    fetchHarvests();
    fetchFerts();
  }, [fetchCrops, fetchIrrigations, fetchHarvests, fetchFerts]);

  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = [];

    // Planting dates (crops)
    for (const c of crops) {
      result.push({
        title: `🌱 Siembra: ${c.variety}`,
        start: new Date(c.planting_date + "T00:00:00"),
        end: new Date(c.planting_date + "T23:59:59"),
        allDay: true,
        resource: { type: "crop", entityId: c.id },
      });
      if (c.estimated_harvest_date) {
        result.push({
          title: `📅 Cosecha est.: ${c.variety}`,
          start: new Date(c.estimated_harvest_date + "T00:00:00"),
          end: new Date(c.estimated_harvest_date + "T23:59:59"),
          allDay: true,
          resource: { type: "crop", entityId: c.id },
        });
      }
    }

    // Irrigation dates
    for (const i of irrigations) {
      result.push({
        title: `💧 Riego: ${i.amount}L (${i.method})`,
        start: new Date(i.irrigation_date + "T00:00:00"),
        end: new Date(i.irrigation_date + "T23:59:59"),
        allDay: true,
        resource: { type: "irrigation", entityId: i.id },
      });
    }

    // Harvest dates
    for (const h of harvests) {
      result.push({
        title: `🍕 Cosecha: ${h.cantidad} ${h.unidad}`,
        start: new Date(h.fecha_cosecha + "T00:00:00"),
        end: new Date(h.fecha_cosecha + "T23:59:59"),
        allDay: true,
        resource: { type: "harvest", entityId: h.id },
      });
    }

    // Fertilization dates
    for (const f of fertilizations) {
      result.push({
        title: `🧪 Fert.: ${f.producto}`,
        start: new Date(f.fecha_aplicacion + "T00:00:00"),
        end: new Date(f.fecha_aplicacion + "T23:59:59"),
        allDay: true,
        resource: { type: "fertilization", entityId: f.id },
      });
    }

    return result;
  }, [crops, irrigations, harvests, fertilizations]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => {
      const c = event.resource ? colorFor(event.resource.type) : colorFor("");
      return {
        style: {
          backgroundColor: c.bg,
          borderLeft: `4px solid ${c.border}`,
          color: c.text,
          fontSize: "0.8rem",
          borderRadius: "4px",
          padding: "2px 4px",
        },
      };
    },
    []
  );

  const loading = loadingCrops || loadingIrrig || loadingHarv || loadingFerts;

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
        Cargando...
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-primary-dark">
        Calendario
      </h1>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        <LegendBadge icon={Sprout} label="Cultivos" color="crop" />
        <LegendBadge icon={Droplets} label="Riegos" color="irrigation" />
        <LegendBadge icon={Pizza} label="Cosechas" color="harvest" />
        <LegendBadge icon={FlaskConical} label="Fertilizaciones" color="fertilization" />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <Calendar<CalendarEvent>
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventPropGetter}
          onSelectEvent={handleSelectEvent}
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay eventos en este rango.",
          }}
        />
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary-dark">
                Detalle del evento
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-primary-dark"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium text-muted-foreground">Título: </span>
                <span className="text-primary-dark">{selectedEvent.title}</span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">Fecha: </span>
                <span className="text-primary-dark">
                  {moment(selectedEvent.start).format("DD [de] MMMM [de] YYYY")}
                </span>
              </p>
              {selectedEvent.resource && (
                <p>
                  <span className="font-medium text-muted-foreground">Tipo: </span>
                  <span className="capitalize text-primary-dark">{selectedEvent.resource.type}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendBadge({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}) {
  const c = colorFor(color);
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}
