import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useParcelsStore } from "../../stores/parcels";
import { geocodeLocation, spreadCoords } from "../../shared/utils/geocode";

// Fix default marker icon path issue with bundlers
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

interface ParcelMarker {
  id: number;
  name: string;
  area: number;
  location: string;
  coords: [number, number];
}

function CenterOnMarkers({ markers }: { markers: ParcelMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView(markers[0].coords, 13);
    } else {
      const bounds = L.latLngBounds(
        markers.map((m) => L.latLng(m.coords[0], m.coords[1])),
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [markers, map]);

  return null;
}

export function MapPage() {
  const { parcels, fetchAll, loading } = useParcelsStore();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Delay map rendering to let the container mount
  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const markers: ParcelMarker[] = useMemo(() => {
    return parcels.map((p, i) => {
      const baseCoords = geocodeLocation(p.location);
      const coords = spreadCoords(baseCoords, i, parcels.length);
      return {
        id: p.id,
        name: p.name,
        area: p.area,
        location: p.location,
        coords,
      };
    });
  }, [parcels]);

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
        Mapa de Parcelas
      </h1>

      {parcels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <MapPin className="mx-auto mb-3 h-10 w-10 opacity-30" />
          No hay parcelas registradas para mostrar en el mapa.
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
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((m) => (
                  <Marker key={m.id} position={m.coords}>
                    <Popup>
                      <div className="min-w-[180px]">
                        <h3 className="text-sm font-semibold text-primary-dark">
                          {m.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {m.area.toLocaleString("es-ES")} ha
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.location}
                        </p>
                        <Link
                          to={`/parcels/${m.id}`}
                          className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                        >
                          Ver detalle →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                <CenterOnMarkers markers={markers} />
              </MapContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
