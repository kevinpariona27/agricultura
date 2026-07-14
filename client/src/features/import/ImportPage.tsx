import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { useParcelsStore } from "../../stores/parcels";
import { useCropsStore } from "../../stores/crops";
import { useInventoryStore } from "../../stores/inventory";

type EntityType = "parcels" | "crops" | "inventory";

const ENTITY_LABELS: Record<EntityType, string> = {
  parcels: "Parcelas",
  crops: "Cultivos",
  inventory: "Inventario",
};

interface ParsedRow {
  [key: string]: string;
}

export function ImportPage() {
  const navigate = useNavigate();
  const [entityType, setEntityType] = useState<EntityType>("parcels");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const { create: createParcel } = useParcelsStore();
  const { create: createCrop } = useCropsStore();
  const { create: createItem } = useInventoryStore();

  const handleFileDrop = useCallback((file: File) => {
    setFileName(file.name);
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          setColumns(Object.keys(results.data[0]));
          setRows(results.data.slice(0, 5));
        }
      },
      error: () => {
        setRows([]);
        setColumns([]);
      },
    });
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileDrop(file);
    },
    [handleFileDrop]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileDrop(file);
    },
    [handleFileDrop]
  );

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    let success = 0;
    let errors = 0;

    // Re-parse full file
    const fileInput = document.querySelector<HTMLInputElement>("#csv-file-input");
    const file = fileInput?.files?.[0];
    if (!file) {
      setImporting(false);
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        for (const row of results.data) {
          try {
            switch (entityType) {
              case "parcels":
                await createParcel({
                  name: row.name || row.nombre || "",
                  area: parseFloat(row.area || "0"),
                  location: row.location || row.ubicacion || "",
                  soil_type: row.soil_type || row.tipo_suelo || "",
                });
                break;
              case "crops":
                await createCrop({
                  parcel_id: parseInt(row.parcel_id || "0"),
                  variety: row.variety || row.variedad || "",
                  planting_date: row.planting_date || row.fecha_siembra || "",
                  status: (row.status || row.estado || "planificado") as any,
                  estimated_harvest_date: row.estimated_harvest_date || row.fecha_estimada_cosecha || undefined,
                  planting_density: row.planting_density ? parseFloat(row.planting_density) : undefined,
                  notes: row.notes || row.notas || undefined,
                });
                break;
              case "inventory":
                await createItem({
                  nombre: row.nombre || "",
                  categoria: row.categoria || "otro",
                  cantidad: parseFloat(row.cantidad || "0"),
                  unidad: row.unidad || "unidad",
                  fecha_adquisicion: row.fecha_adquisicion || undefined,
                  fecha_vencimiento: row.fecha_vencimiento || undefined,
                  costo_unitario: row.costo_unitario ? parseFloat(row.costo_unitario) : undefined,
                  notas: row.notas || undefined,
                });
                break;
            }
            success++;
          } catch {
            errors++;
          }
        }
        setResult({ success, errors });
        setImporting(false);
      },
      error: () => {
        setResult({ success, errors: 1 });
        setImporting(false);
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-sm text-green-700 hover:underline"
      >
        ← Volver
      </button>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">
        Importar datos CSV
      </h1>

      {/* Entity selector */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Tipo de entidad
        </label>
        <div className="flex gap-2">
          {(Object.keys(ENTITY_LABELS) as EntityType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setEntityType(type);
                setRows([]);
                setColumns([]);
                setFileName("");
                setResult(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                entityType === type
                  ? "bg-primary text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {ENTITY_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          fileName
            ? "border-primary bg-primary-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById("csv-file-input")?.click()}
      >
        {fileName ? (
          <>
            <FileSpreadsheet className="mb-2 h-10 w-10 text-primary" />
            <p className="text-sm font-medium text-primary-dark">{fileName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {rows.length} filas detectadas (mostrando primeras 5)
            </p>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-500">
              Arrastra un archivo CSV o haz clic para seleccionar
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Formato: CSV con encabezados
            </p>
          </>
        )}
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Preview table */}
      {rows.length > 0 && columns.length > 0 && (
        <div className="mb-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 font-medium capitalize">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 text-gray-700">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import button */}
      {rows.length > 0 && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {importing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Importar registros
            </>
          )}
        </button>
      )}

      {/* Result */}
      {result && (
        <div
          className={`mt-6 rounded-xl border p-4 ${
            result.errors === 0
              ? "border-primary bg-primary-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {result.errors === 0 ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            <p className="text-sm font-medium">
              {result.success} registros importados correctamente
              {result.errors > 0 && `, ${result.errors} errores`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
