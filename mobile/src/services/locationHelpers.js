import * as Location from "expo-location";

function toRad(value) {
  return (value * Math.PI) / 180;
}

export function haversineKm(a, b) {
  if (!a || !b) return null;

  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);

  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const sourceLat = toRad(lat1);
  const targetLat = toRad(lat2);
  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(sourceLat) * Math.cos(targetLat);
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return earthRadiusKm * c;
}

export async function requestCurrentLocation() {
  try {
    const existingPermission = await Location.getForegroundPermissionsAsync();
    let status = existingPermission.status;

    if (status !== "granted") {
      const requestedPermission = await Location.requestForegroundPermissionsAsync();
      status = requestedPermission.status;
    }

    if (status !== "granted") {
      return null;
    }

    const provider = await Location.getProviderStatusAsync();
    if (!provider.locationServicesEnabled) {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocodeLocation(coords) {
  if (!coords) return null;

  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
    });

    const first = results?.[0];
    if (!first) return null;

    return [
      first.city,
      first.district,
      first.subregion,
      first.region,
    ].find(Boolean) || null;
  } catch {
    return null;
  }
}

export function attachDistanceToPlaces(places, userLocation) {
  return (places || []).map((place) => {
    const km = haversineKm(userLocation, {
      latitude: place.latitude,
      longitude: place.longitude,
    });

    return {
      ...place,
      distance: km === null ? place.distance ?? null : Number(km.toFixed(1)),
    };
  });
}
