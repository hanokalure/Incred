export async function reverseGeocodeLocation({ latitude, longitude }) {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    throw new Error("Invalid coordinates");
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "10",
    addressdetails: "1",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to resolve location name");
  }

  const data = await response.json();
  const address = data?.address || {};
  return (
    address.city ||
    address.town ||
    address.county ||
    address.state_district ||
    address.state ||
    data?.display_name ||
    null
  );
}
