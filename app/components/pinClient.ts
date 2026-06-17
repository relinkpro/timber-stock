"use client";

// Manages the shared admin PIN on the device. The PIN is asked for once,
// stored in localStorage, and sent with every mutating request. The server
// is the real gatekeeper (see lib/pin.ts) — this is only convenience.

const KEY = "timber-stock-pin";

export function getStoredPin(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setStoredPin(pin: string): void {
  window.localStorage.setItem(KEY, pin);
}

export function clearStoredPin(): void {
  window.localStorage.removeItem(KEY);
}

// Return a usable PIN, prompting the user once if we don't have one yet.
export function ensurePin(): string | null {
  let pin = getStoredPin();
  if (!pin) {
    pin = window.prompt("Enter the admin PIN")?.trim() || null;
    if (pin) setStoredPin(pin);
  }
  return pin;
}
