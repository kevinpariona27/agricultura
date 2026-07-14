import { useEffect, useMemo, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { MapPin, Ruler } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useParcelsStore } from "../../stores/parcels";
import { geocodeLocation, spreadCoords } from "../../shared/utils/geocode";

// Fix default marker icon
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface ParcelMarker {
  id: number;
  name: string;
  area: number;
  location: string;
  coords: [number, number];
}

interface DrawnPolygon {
  latlngs: [number, number][];
  area: number;
}

function CenterOnMarkers({ markers }: { markers: ParcelMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView(markers[0].coords, 13);
    } else {
      const bounds = L.latLngBounds(markers.map((m) => L.latLng(m.coords[0], m.coords[1])));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [markers, map]);
  return null;
}

function DrawControl({ onPolygonDrawn }: { onPolygonDrawn: (poly: DrawnPolygon) => void }) {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new (L.Control as any).Draw({
      edit: { featureGroup: drawnItems },
      draw: {
        polygon: { allowIntersection: false, showArea: true, metric: true, shapeOptions: { color: "#15803D" } },
        rectangle: { shapeOptions: { color: "#15803D" }, metric: true },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      const coords: [number, number][] = latlngs.map((ll) => [ll.lat, ll.lng]);

      // Calculate area using Leaflet's spherical area
      const areaSqM = L.GeometryUtil.geodesicArea(latlngs);
      const areaHa = Math.round(areaSqM / 100) / 10; // m² → hectares

      onPolygonDrawn({ latlngs: coords, area: areaHa });
    });

    return () => {
      map.removeLayer(drawnItems);
      map.removeControl(drawControl);
    };
  }, [map, onPolygonDrawn]);

  return null;
}

export function MapPage() {
  const { parcels, fetchAll, loading, create } = useParcelsStore();
  const [mapReady, setMapReady] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<DrawnPolygon | null>(null);
  const [parcelName, setParcelName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const t = setTimeout(() => setMapReady(true), 100); return () => clearTimeout(t); }, []);

  const markers: ParcelMarker[] = useMemo(() => {
    return parcels.map((p, i) => ({
      id: p.id, name: p.name, area: p.area, location: p.location,
      coords: spreadCoords(geocodeLocation(p.location), i, parcels.length),
    }));
  }, [parcels]);

  const handlePolygonDrawn = useCallback((poly: DrawnPolygon) => {
    setDrawnPolygon(poly);
    setParcelName(`Nueva parcela ${parcels.length + 1}`);
  }, [parcels.length]);

  const handleSaveParcel = async () => {
    if (!drawnPolygon || !parcelName.trim()) return;
    setSaving(true);
    try {
      const center = drawnPolygon.latlngs.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
      const avgLat = center[0] / drawnPolygon.latlngs.length;
      const avgLng = center[1] / drawnPolygon.latlngs.length;
      const area = drawnPolygon.area;

      await create({
        name: parcelName.trim(),
        area,
        location: `Lat ${avgLat.toFixed(4)}, Lng ${avgLng.toFixed(4)}`,
        soil_type: "franco",
      });
      setDrawnPolygon(null);
      setParcelName("");
      fetchAll();
    } catch { /* handle error silently */ }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-primary-dark">Mapa de Parcelas</h1>
      <p className="mb-6 text-sm text-muted-foreground">Usá las herramientas de dibujo para delimitar nuevas parcelas sobre el mapa.</p>

      {drawnPolygon && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-dark">
            <Ruler className="h-4 w-4" />
            {drawnPolygon.area.toLocaleString("es-ES")} ha
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={parcelName}
              onChange={(e) => setParcelName(e.target.value)}
              placeholder="Nombre de la parcela"
              className="w-full rounded-lg border border-border bg-app-bg px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={handleSaveParcel}
            disabled={saving || !parcelName.trim()}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar como parcela"}
          </button>
          <button
            onClick={() => setDrawnPolygon(null)}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
          >
            Cancelar
          </button>
        </div>
      )}

      {parcels.length === 0 && !drawnPolygon ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <MapPin className="mx-auto mb-3 h-10 w-10 opacity-30" />
          No hay parcelas registradas. Usá las herramientas de dibujo para crear la primera.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          {mapReady && (
            <div style={{ height: "70vh", width: "100%" }}>
              <MapContainer
                center={[-38.4161, -63.6167]}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((m) => (
                  <Marker key={m.id} position={m.coords}>
                    <Popup>
                      <div className="min-w-[180px]">
                        <h3 className="text-sm font-semibold text-primary-dark">{m.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{m.area.toLocaleString("es-ES")} ha</p>
                        <p className="text-xs text-muted-foreground">{m.location}</p>
                        <Link to={`/parcels/${m.id}`} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                          Ver detalle →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                <DrawControl onPolygonDrawn={handlePolygonDrawn} />
                <CenterOnMarkers markers={markers} />
              </MapContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
