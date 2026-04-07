const API_BASE_URL = String(process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

function toProxyPlaceImageUrl(objectPath) {
  if (!objectPath) return objectPath;
  return `${API_BASE_URL}/files/place-images/${objectPath}`;
}

function toProxyStoryMediaUrl(objectPath) {
  if (!objectPath) return objectPath;
  return `${API_BASE_URL}/files/story-media/${objectPath}`;
}

function extractPlaceImagesObjectPath(urlOrPath) {
  if (!urlOrPath) return null;

  // Already a relative object path stored in DB, e.g. "places/<uuid>.jpg".
  if (typeof urlOrPath === "string" && urlOrPath.startsWith("places/")) return urlOrPath;

  if (typeof urlOrPath !== "string") return null;

  // Prefer proxy URLs as-is.
  if (urlOrPath.includes("/files/place-images/")) return null;

  // Signed URL format:
  //   .../storage/v1/object/sign/place-images/<objectPath>?token=...
  const signedMarker = "/storage/v1/object/sign/place-images/";
  const signedIdx = urlOrPath.indexOf(signedMarker);
  if (signedIdx !== -1) {
    const rest = urlOrPath.slice(signedIdx + signedMarker.length);
    return rest.split("?")[0];
  }

  // Public URL format:
  //   .../storage/v1/object/public/place-images/<objectPath>
  const publicMarker = "/storage/v1/object/public/place-images/";
  const publicIdx = urlOrPath.indexOf(publicMarker);
  if (publicIdx !== -1) {
    return urlOrPath.slice(publicIdx + publicMarker.length);
  }

  return null;
}

function extractStoryObjectPath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== "string") return null;
  if (urlOrPath.startsWith("places/stories/")) return urlOrPath;
  if (urlOrPath.includes("/files/story-media/")) return null;
  return null;
}

export function toDisplayImageUrl(imageUrl) {
  if (!imageUrl) return imageUrl;

  const objectPath = extractPlaceImagesObjectPath(imageUrl);
  if (objectPath) return toProxyPlaceImageUrl(objectPath);
  return imageUrl;
}

export function toDisplayMediaUrl(mediaUrl) {
  const storyObjectPath = extractStoryObjectPath(mediaUrl);
  if (storyObjectPath) return toProxyStoryMediaUrl(storyObjectPath);
  return toDisplayImageUrl(mediaUrl);
}
