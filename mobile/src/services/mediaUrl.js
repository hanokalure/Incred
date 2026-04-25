import { getApiBaseUrl } from "./runtimeConfig";

function toProxyPlaceImageUrl(objectPath) {
  if (!objectPath) return objectPath;
  return `${getApiBaseUrl()}/files/place-images/${objectPath}`;
}

function toProxyStoryMediaUrl(objectPath) {
  if (!objectPath) return objectPath;
  return `${getApiBaseUrl()}/files/story-media/${objectPath}`;
}

function toProxyProfilePicUrl(objectPath) {
  if (!objectPath) return objectPath;
  return `${getApiBaseUrl()}/files/profile-pictures/${objectPath}`;
}

function extractProxyObjectPath(urlOrPath, bucketPath) {
  if (!urlOrPath || typeof urlOrPath !== "string") return null;

  const marker = `/files/${bucketPath}/`;
  const markerIndex = urlOrPath.indexOf(marker);
  if (markerIndex === -1) return null;

  return urlOrPath.slice(markerIndex + marker.length).split("?")[0];
}

function extractPlacesObjectPath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== "string") return null;
  const clean = urlOrPath.split("?")[0];

  if (clean.startsWith("places/")) return clean;

  // Handles s3://bucket/places/... and https://...amazonaws.com/.../places/...
  const placesIndex = clean.indexOf("places/");
  if (placesIndex !== -1) return clean.slice(placesIndex);

  return null;
}

function extractProfilePicObjectPath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== "string") return null;
  const placesPath = extractPlacesObjectPath(urlOrPath);
  if (placesPath && placesPath.includes("/profiles/")) return placesPath;
  if (!urlOrPath.includes("/") || (urlOrPath.split("/").length === 2 && !urlOrPath.includes("://"))) {
    return urlOrPath;
  }
  return extractProxyObjectPath(urlOrPath, "profile-pictures");
}

function extractPlaceImagesObjectPath(urlOrPath) {
  if (!urlOrPath) return null;

  const placesPath = extractPlacesObjectPath(urlOrPath);
  if (placesPath) return placesPath;

  if (typeof urlOrPath !== "string") return null;

  const proxiedObjectPath = extractProxyObjectPath(urlOrPath, "place-images");
  if (proxiedObjectPath) return proxiedObjectPath;

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
  const placesPath = extractPlacesObjectPath(urlOrPath);
  if (placesPath && placesPath.includes("/stories/")) return placesPath;
  if (urlOrPath.startsWith("places/stories/")) return urlOrPath;
  const proxiedObjectPath = extractProxyObjectPath(urlOrPath, "story-media");
  if (proxiedObjectPath) return proxiedObjectPath;
  return null;
}

export function toDisplayImageUrl(imageUrl) {
  if (!imageUrl) return imageUrl;

  const objectPath = extractPlaceImagesObjectPath(imageUrl);
  if (objectPath) return toProxyPlaceImageUrl(objectPath);
  return imageUrl;
}

export function toDisplayMediaUrl(mediaUrl) {
  const profilePicPath = extractProfilePicObjectPath(mediaUrl);
  if (profilePicPath) return toProxyProfilePicUrl(profilePicPath);

  const storyObjectPath = extractStoryObjectPath(mediaUrl);
  if (storyObjectPath) return toProxyStoryMediaUrl(storyObjectPath);
  return toDisplayImageUrl(mediaUrl);
}
