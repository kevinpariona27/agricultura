import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIrrigationsStore } from "../../stores/irrigations";
import { useCropsStore } from "../../stores/crops";
import { IrrigationTable } from "./components/IrrigationTable";
import {
  IRRIGATION_METHOD_OPTIONS,
} from "./components/IrrigationForm";

export function IrrigationListPage() {
  const navigate = useNavigate();
  const { irrigations, loading, error, fetchAll, clearError } =
    useIrrigationsStore();
  const crops = useCropsStore((s) => s.crops);
  const fetchCrops = useCropsStore((s) => s.fetchAll);

  const [cropId, setCropId] = useState("");
  const [method, setMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchCrops();
    fetchAll();
    return () => clearError();
  }, [fetchAll, clearError, fetchCrops]);

  const applyFilters = useCallback(
    (overrides?: {
      crop_id?: string;
      method?: string;
      date_from?: string;
      date_to?: string;
    }) => {
      const c = overrides?.crop_id ?? cropId;
      const m = overrides?.method ?? method;
      const df = overrides?.date_from ?? dateFrom;
      const dt = overrides?.date_to ?? dateTo;
      fetchAll({
        crop_id: c ? Number(c) : undefined,
        method: (m || undefined) as any,
        date_from: df || undefined,
        date_to: dt || undefined,
      }).catch(() => {});
    },
    [fetchAll, cropId, method, dateFrom, dateTo]
  );

  const selectClass =
    "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";
  const dateClass =
    "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Riegos</h1>
        <button
          onClick={() => navigate("/irrigations/new")}
          className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
        >
          + Nuevo riego
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="filter-crop"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Cultivo
          </label>
          <select
            id="filter-crop"
            value={cropId}
            onChange={(e) => {
              setCropId(e.target.value);
              applyFilters({ crop_id: e.target.value });
            }}
            className={selectClass}
          >
            <option value="">Todos</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.variety}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-method"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Método
          </label>
          <select
            id="filter-method"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              applyFilters({ method: e.target.value });
            }}
            className={selectClass}
          >
            <option value="">Todos</option>
            {IRRIGATION_METHOD_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-date-from"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Desde
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              applyFilters({ date_from: e.target.value });
            }}
            className={dateClass}
          />
        </div>

        <div>
          <label
            htmlFor="filter-date-to"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Hasta
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              applyFilters({ date_to: e.target.value });
            }}
            className={dateClass}
          />
        </div>
      </div>

      {loading && irrigations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
          Cargando...
        </div>
      ) : (
        <IrrigationTable irrigations={irrigations} />
      )}
    </div>
  );
}
