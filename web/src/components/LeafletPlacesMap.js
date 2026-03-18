import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Tooltip, ZoomControl, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { toDisplayImageUrl } from "../services/mediaUrl";
import { getPlaceCategoryLabel } from "../constants/placeCategories";

const DEFAULT_CENTER = [14.8, 75.8];

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function categoryMeta(category) {
  // Simple but distinct. You can tweak colors/icons freely.
  switch (category) {
    case "restaurant":
      return { color: "#fb7185" };
    case "generational_shop":
      return { color: "#34d399" };
    case "tourist_place":
      return { color: "#fbbf24" };
    case "hidden_gem":
      return { color: "#38bdf8" };
    case "stay":
      return { color: "#a78bfa" };
    default:
      return { color: "#cbd5e1" };
  }
}

function makePinIcon(color) {
  return L.divIcon({
    className: "",
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    html: `<div class="ik-pin" style="background:${color}"><div class="ik-pin-dot"></div></div>`,
  });
}

const YOU_ICON = L.divIcon({
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  html: `<div class="ik-you"></div>`,
});

function RecenterOnChange({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center?.length) {
      return;
    }
    map.setView(center, Math.max(map.getZoom(), 9), { animate: true });
  }, [map, center]);

  return null;
}

export default function LeafletPlacesMap({
  places,
  selectedCategory,
  center,
  userLocation,
  onSelectPlace,
}) {
  const visible = useMemo(() => {
    const filtered = selectedCategory === "All"
      ? places
      : places.filter((p) => p.category === selectedCategory);

    // Only plot places that actually have coordinates.
    return (filtered || []).filter(
      (p) => isFiniteNumber(Number(p.latitude)) && isFiniteNumber(Number(p.longitude))
    );
  }, [places, selectedCategory]);

  const mapCenter = center || DEFAULT_CENTER;

  return (
    <MapContainer
      center={mapCenter}
      zoom={7}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <RecenterOnChange center={mapCenter} />

      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <ZoomControl position="bottomright" />

      {userLocation && isFiniteNumber(Number(userLocation.latitude)) && isFiniteNumber(Number(userLocation.longitude)) ? (
        <Marker
          position={[Number(userLocation.latitude), Number(userLocation.longitude)]}
          icon={YOU_ICON}
          interactive={false}
        />
      ) : null}

      {visible.map((p) => (
        <Marker
          key={p.id}
          position={[Number(p.latitude), Number(p.longitude)]}
          icon={makePinIcon(categoryMeta(p.category).color)}
          eventHandlers={{
            click: () => onSelectPlace?.(p),
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1} sticky>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 10,
                  background: "#0f172a",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p.image_urls?.[0] ? (
                  <img
                    src={toDisplayImageUrl(p.image_urls[0])}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>
                    No photo
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 12 }}>{p.name}</div>
                <div style={{ fontSize: 10, opacity: 0.85 }}>{getPlaceCategoryLabel(p.category)}</div>
              </div>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
