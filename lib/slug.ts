// Build a URL-safe slug from the product name + size, e.g.
//   "Plywood", "2440 x 1220 x 18mm"  ->  "plywood-2440x1220x18mm"
export function slugify(...parts: (string | null | undefined)[]): string {
  const base = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[×x]/g, "x") // normalise multiplication signs
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "item";
}

// Short random suffix used to guarantee uniqueness when a slug collides.
export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}
