export const toProperCase = (value) => {
  if (value === null || value === undefined) return "";

  const source = Array.isArray(value)
    ? value.join(" ")
    : typeof value === "string"
    ? value
    : String(value);

  if (!source) return "";

  return source
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
