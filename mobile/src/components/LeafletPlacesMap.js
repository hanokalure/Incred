import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";

const DEFAULT_CENTER = [14.8, 75.8];

function categoryMeta(category) {
  switch (category) {
    case "restaurant":
      return { color: "#fb7185", label: "Food" };
    case "generational_shop":
      return { color: "#34d399", label: "Shops" };
    case "tourist_place":
      return { color: "#fbbf24", label: "Tourist" };
    case "hidden_gem":
      return { color: "#38bdf8", label: "Hidden Gems" };
    case "stay":
      return { color: "#a78bfa", label: "Stay" };
    default:
      return { color: "#cbd5e1", label: category || "Other" };
  }
}

function buildPreviewMedia(place, limit = 3) {
  const images = (place?.image_urls || []).map((url) => ({ type: "image", url: toDisplayImageUrl(url) }));
  const videos = (place?.video_urls || []).map((url) => ({ type: "video", url: toDisplayMediaUrl(url) }));
  return [...images, ...videos].slice(0, limit);
}

function sanitizePlaces(places) {
  return (places || [])
    .filter((place) => Number.isFinite(Number(place?.latitude)) && Number.isFinite(Number(place?.longitude)))
    .map((place) => ({
      id: String(place.id),
      name: place.name || "Unknown place",
      category: categoryMeta(place.category).label,
      categoryColor: categoryMeta(place.category).color,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      image_urls: place.image_urls || [],
      video_urls: place.video_urls || [],
      previewMedia: buildPreviewMedia(place, 3),
    }));
}

function buildHtml({ places, selectedCategory, center, userLocation, activePlaceId }) {
  const mapCenter = Array.isArray(center) && center.length === 2 ? center : DEFAULT_CENTER;
  const payload = {
    places: sanitizePlaces(places),
    selectedCategory,
    center: mapCenter,
    userLocation: userLocation
      ? {
          latitude: Number(userLocation.latitude),
          longitude: Number(userLocation.longitude),
        }
      : null,
    activePlaceId: activePlaceId ? String(activePlaceId) : null,
  };

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f8f9fa; }
      .leaflet-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .ik-pin {
        width: 42px;
        height: 52px;
        border-radius: 24px 24px 24px 6px;
        transform: rotate(45deg);
        box-shadow: 0 12px 26px rgba(15,23,42,0.26);
        border: 3px solid rgba(255,255,255,0.96);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 120ms ease, box-shadow 120ms ease;
        position: relative;
      }
      .ik-pin.active {
        width: 48px;
        height: 60px;
        box-shadow: 0 16px 32px rgba(15,23,42,0.34);
      }
      .ik-pin-ring {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        border: 3px solid rgba(255,255,255,0.96);
        background: rgba(255,255,255,0.18);
        transform: rotate(-45deg);
      }
      .ik-pin-core {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #ffffff;
        transform: rotate(-45deg);
      }
      .ik-pin.active .ik-pin-ring {
        width: 20px;
        height: 20px;
      }
      .ik-you {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: #ce1126;
        border: 3px solid rgba(255,255,255,0.98);
        box-shadow: 0 0 0 10px rgba(206, 17, 38, 0.16);
      }
      .ik-popup {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 220px;
      }
      .ik-title {
        font-size: 13px;
        font-weight: 800;
        color: #111827;
      }
      .ik-meta {
        font-size: 11px;
        color: #4b5563;
      }
      .ik-media-row {
        display: flex;
        gap: 6px;
      }
      .ik-media {
        width: 62px;
        height: 46px;
        border-radius: 8px;
        overflow: hidden;
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.2);
      }
      .ik-media img, .ik-media video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .ik-empty {
        font-size: 10px;
        color: #94a3b8;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const payload = ${JSON.stringify(payload)};
      const selectedCategory = payload.selectedCategory;
      const visiblePlaces = payload.places.filter((place) =>
        selectedCategory === "All" ? true : place.category === (
          selectedCategory === "restaurant" ? "Food" :
          selectedCategory === "generational_shop" ? "Shops" :
          selectedCategory === "tourist_place" ? "Tourist" :
          selectedCategory === "hidden_gem" ? "Hidden Gems" :
          selectedCategory === "stay" ? "Stay" :
          selectedCategory
        )
      );

      const map = L.map("map", { zoomControl: false }).setView(payload.center, 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      function makePinIcon(color) {
        return L.divIcon({
          className: "",
          iconSize: [34, 44],
          iconAnchor: [17, 44],
          html: '<div class="ik-pin" style="background:' + color + '"><div class="ik-pin-dot"></div></div>'
        });
      }

      const youIcon = L.divIcon({
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        html: '<div class="ik-you"></div>'
      });

      if (payload.userLocation && Number.isFinite(payload.userLocation.latitude) && Number.isFinite(payload.userLocation.longitude)) {
        L.marker([payload.userLocation.latitude, payload.userLocation.longitude], {
          icon: youIcon,
          interactive: false
        }).addTo(map);
      }

      const bounds = [];
      let activeMarker = null;

      visiblePlaces.forEach((place) => {
        const marker = L.marker([place.latitude, place.longitude], {
          icon: L.divIcon({
            className: "",
            iconSize: payload.activePlaceId === place.id ? [48, 60] : [42, 52],
            iconAnchor: payload.activePlaceId === place.id ? [24, 60] : [21, 52],
            html:
              '<div class="ik-pin' + (payload.activePlaceId === place.id ? ' active' : '') + '" style="background:' +
              place.categoryColor +
              '"><div class="ik-pin-ring"></div><div class="ik-pin-core"></div></div>'
          })
        }).addTo(map);

        marker.on("click", () => {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "select", id: place.id }));
          }
        });

        if (payload.activePlaceId && payload.activePlaceId === place.id) {
          activeMarker = marker;
        }

        bounds.push([place.latitude, place.longitude]);
      });

      if (bounds.length) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }

      if (activeMarker) {
        map.setView(activeMarker.getLatLng(), Math.max(map.getZoom(), 11), { animate: true });
      }
    </script>
  </body>
</html>`;
}

export default function LeafletPlacesMap({
  places,
  selectedCategory = "All",
  center,
  userLocation,
  activePlaceId,
  onSelectPlace,
}) {
  const html = useMemo(
    () => buildHtml({ places, selectedCategory, center, userLocation, activePlaceId }),
    [places, selectedCategory, center, userLocation, activePlaceId]
  );

  const placeIndex = useMemo(() => {
    const map = new Map();
    (places || []).forEach((place) => {
      map.set(String(place.id), place);
    });
    return map;
  }, [places]);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data || "{}");
            if (data.type === "select" && data.id && onSelectPlace) {
              onSelectPlace(placeIndex.get(String(data.id)) || null);
            }
          } catch {
            // Ignore malformed messages from the embedded page.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
