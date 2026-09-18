import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { NASHIK_CENTER, NASHIK_MAP_BOUNDS } from "@/lib/policy";

function RecenterOnPin({ point }: { point: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.setView([point.lat, point.lng], Math.max(map.getZoom(), 15));
  }, [map, point]);
  return null;
}

/**
 * View-only map of the Nashik service area. The pin is placed only from the
 * citizen's device GPS — it cannot be clicked or dragged to another spot.
 */
export default function NashikLocationPicker({
  value,
}: {
  value: { lat: number; lng: number } | null;
}) {
  return (
    <div className="h-80 overflow-hidden rounded-sm border border-border-strong">
      <MapContainer
        center={[value?.lat ?? NASHIK_CENTER.lat, value?.lng ?? NASHIK_CENTER.lng]}
        zoom={13}
        minZoom={11}
        maxBounds={NASHIK_MAP_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnPin point={value} />
        {value ? (
          <CircleMarker
            center={[value.lat, value.lng]}
            radius={10}
            pathOptions={{ color: "#153b67", fillColor: "#1677b8", fillOpacity: 0.8, weight: 3 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
