export const PLACE_CATEGORY_OPTIONS = [
  { value: "restaurant", label: "Restaurant" },
  { value: "generational_shop", label: "Generational Shop" },
  { value: "tourist_place", label: "Tourist Place" },
  { value: "hidden_gem", label: "Hidden Gem" },
  { value: "stay", label: "Stay" },
];

export function getPlaceCategoryLabel(value) {
  return PLACE_CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value || "Place";
}
