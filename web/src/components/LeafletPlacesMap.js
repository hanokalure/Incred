import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Tooltip, ZoomControl, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { getPlaceCategoryLabel } from "../constants/placeCategories";

const DEFAULT_CENTER = [14.8, 75.8];

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function categoryMeta(category) {
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

function buildPreviewMedia(place, limit = 3) {
  const images = (place?.image_urls || []).map((url) => ({ type: "image", url }));
  const videos = (place?.video_urls || []).map((url) => ({ type: "video", url }));
  return [...images, ...videos].slice(0, limit);
}

function RecenterOnChange({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center?.length) return;
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

    return (filtered || []).filter(
      (p) => isFiniteNumber(Number(p.latitude)) && isFiniteNumber(Number(p.longitude))
    );
  }, [places, selectedCategory]);

  const mapCenter = center || DEFAULT_CENTER;

  return (
    <MapContainer center={mapCenter} zoom={7} style={{ width: "100%", height: "100%" }} zoomControl={false}>
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

      {visible.map((p) => {
        const media = buildPreviewMedia(p, 3);
        const photoCount = p.image_urls?.length || 0;
        const videoCount = p.video_urls?.length || 0;

        return (
          <Marker
            key={p.id}
            position={[Number(p.latitude), Number(p.longitude)]}
            icon={makePinIcon(categoryMeta(p.category).color)}
            eventHandlers={{ click: () => onSelectPlace?.(p) }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} sticky>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 220 }}>
                <div style={{ fontWeight: 800, fontSize: 12 }}>{p.name}</div>
                <div style={{ fontSize: 10, opacity: 0.85 }}>{getPlaceCategoryLabel(p.category)}</div>
                <div style={{ fontSize: 10, opacity: 0.85 }}>
                  {photoCount} photo{photoCount === 1 ? "" : "s"} • {videoCount} video{videoCount === 1 ? "" : "s"}
                </div>

                {media.length ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    {media.map((item, idx) => (
                      <div
                        key={`${item.url}-${idx}`}
                        style={{
                          width: 62,
                          height: 46,
                          borderRadius: 8,
                          background: "#0f172a",
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        {item.type === "image" ? (
                          <img
                            src={toDisplayImageUrl(item.url)}
                            alt={p.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <video
                            src={toDisplayMediaUrl(item.url)}
                            muted
                            autoPlay
                            loop
                            playsInline
                            preload="metadata"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>No media</div>
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
