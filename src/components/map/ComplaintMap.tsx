import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  band?: string | null;
};

const BAND_COLOR: Record<string, string> = {
  critical: "#b3261e",
  high: "#b25e02",
  medium: "#1668a8",
  low: "#5a6472",
};

/**
 * Browser-only map of reported locations. Pins show where a report says the
 * problem is; they are never proof that the reporter was standing there.
 */
export default function ComplaintMap({
  points,
  height = 320,
}: {
  points: MapPoint[];
  height?: number;
}) {
  if (points.length === 0) return null;

  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;

  // Zoom to how far apart the pins actually are, so a cluster of reports on one
  // street is not shown as a single dot on a city-wide map.
  const spread = Math.max(
    ...points.map((point) => Math.abs(point.lat - lat)),
    ...points.map((point) => Math.abs(point.lng - lng)),
    0,
  );
  const zoom =
    spread < 0.0015 ? 17 : spread < 0.005 ? 16 : spread < 0.02 ? 14 : spread < 0.08 ? 12 : 11;

  return (
    <div className="overflow-hidden rounded-sm border border-border" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={9}
            pathOptions={{
              color: BAND_COLOR[point.band ?? "medium"] ?? BAND_COLOR['medium']!,
              fillColor: BAND_COLOR[point.band ?? "medium"] ?? BAND_COLOR['medium']!,
              fillOpacity: 0.65,
              weight: 2,
            }}
          >
            <Popup>
              <span className="block text-sm font-semibold">{point.title}</span>
              {point.subtitle ? <span className="block text-xs">{point.subtitle}</span> : null}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
