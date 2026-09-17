import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { NASHIK_CENTER, NASHIK_MAP_BOUNDS, isInNashik } from "@/lib/policy";

function MapClickHandler({
  onPick,
}: {
  onPick: (point: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(event) {
      const point = { lat: event.latlng.lat, lng: event.latlng.lng };
      if (isInNashik(point)) onPick(point);
    },
  });
  return null;
}

/** A real OpenStreetMap picker constrained to the Nashik service area. */
export default function NashikLocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (point: { lat: number; lng: number }) => void;
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
        <MapClickHandler onPick={onChange} />
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