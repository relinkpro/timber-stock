// Server-side PIN check. Every mutating API route runs this first.
export function pinIsValid(pin: unknown): boolean {
  const raw = process.env.INVENTORY_ADMIN_PIN;
  if (!raw) {
    // Misconfiguration — fail closed rather than allowing everything.
    return false;
  }

  // Trim both sides: env files commonly carry trailing whitespace/newlines,
  // and the client may send a value with stray spaces.
  const expected = raw.trim();
  return (
    typeof pin === "string" && expected.length > 0 && pin.trim() === expected
  );
}
