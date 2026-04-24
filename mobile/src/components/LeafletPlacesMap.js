import React, { useRef, useEffect, useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "../theme/colors";

const MAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export default function LeafletPlacesMap({ places, userLocation, activePlaceId, onSelectPlace, mapRef }) {
  const webViewRef = useRef(null);

  useEffect(() => {
    if (mapRef) mapRef.current = {
      animateToRegion: (region) => {
        const script = `map.flyTo([${region.latitude}, ${region.longitude}], ${region.latitudeDelta < 0.05 ? 15 : 12});`;
        webViewRef.current?.injectJavaScript(script);
      },
      zoomIn: () => { webViewRef.current?.injectJavaScript("map.zoomIn();"); },
      zoomOut: () => { webViewRef.current?.injectJavaScript("map.zoomOut();"); }
    };
  }, [mapRef]);

  const htmlContent = useMemo(() => {
    const markersJson = JSON.stringify((places || []).map(p => ({
      id: p.id,
      lat: Number(p.latitude),
      lng: Number(p.longitude)
    })));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #f8f9fa; }
          
          /* CLASSIC PUSHPIN EMOJI */
          .emoji-marker {
            font-size: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            user-select: none;
          }

          .marker-active {
            transform: scale(1.3) translateY(-8px);
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.4));
            z-index: 1000 !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([14.8, 75.8], 7);
          L.tileLayer('${MAP_TILE_URL}').addTo(map);

          const markers = ${markersJson};
          const markerLayer = L.layerGroup().addTo(map);

          markers.forEach(m => {
            const icon = L.divIcon({
              className: 'leaflet-emoji-pin',
              html: '<div class="emoji-marker" id="pin-' + m.id + '">📍</div>',
              iconSize: [40, 40],
              iconAnchor: [12, 38] // Anchor at the very tip of the pushpin
            });
            const marker = L.marker([m.lat, m.lng], { icon }).addTo(markerLayer);
            marker.on('click', (e) => {
              document.querySelectorAll('.emoji-marker').forEach(el => el.classList.remove('marker-active'));
              document.getElementById('pin-' + m.id).classList.add('marker-active');
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_PLACE', id: m.id }));
            });
          });
        </script>
      </body>
      </html>
    `;
  }, [places]);

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_PLACE') {
        const place = places.find(p => p.id === data.id);
        if (place) onSelectPlace(place);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={onMessage}
        style={styles.map}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  map: { flex: 1 },
});
