import { useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons in React/Vite (bundler doesn't resolve default paths)
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const AMMAN_CENTER: [number, number] = [31.9539, 35.9106];

export interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationSelect,
}: LocationPickerProps) {
  const hasValidCoords = latitude !== 0 || longitude !== 0;
  const center: [number, number] = useMemo(
    () => (hasValidCoords ? [latitude, longitude] : AMMAN_CENTER),
    [latitude, longitude, hasValidCoords]
  );
  const markerPosition: [number, number] = useMemo(
    () => (hasValidCoords ? [latitude, longitude] : AMMAN_CENTER),
    [latitude, longitude, hasValidCoords]
  );

  const handleDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      const latlng = e.target.getLatLng();
      onLocationSelect(latlng.lat, latlng.lng);
    },
    [onLocationSelect]
  );

  const eventHandlers = useMemo(
    () => ({
      dragend: handleDragEnd,
    }),
    [handleDragEnd]
  );

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%", minHeight: 300 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onLocationSelect={onLocationSelect} />
      <Marker
        position={markerPosition}
        draggable
        eventHandlers={eventHandlers}
      />
    </MapContainer>
  );
}
