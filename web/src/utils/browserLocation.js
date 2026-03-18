export function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Location is only available in the browser."));
      return;
    }

    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isSecure = window.location.protocol === "https:" || isLocalhost;

    if (!isSecure) {
      reject(new Error("Location access needs HTTPS or localhost."));
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => {
        if (error?.code === error.PERMISSION_DENIED) {
          reject(new Error("Location permission is blocked. Please allow it in the browser."));
          return;
        }
        if (error?.code === error.TIMEOUT) {
          reject(new Error("Location request timed out. Please try again."));
          return;
        }
        reject(new Error(error?.message || "Unable to fetch your location."));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  });
}
