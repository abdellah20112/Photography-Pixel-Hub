export { cn } from "./cn";
export {
  formatBytes,
  formatDate,
  formatDateTime,
  formatNumber,
} from "./format";

/**
 * Generate a cryptographically secure random token.
 * Uses `crypto.getRandomValues` — works in both browser and Node.js.
 * @param length - Character length of the token (default 32)
 */
export function generateToken(length = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[array[i]! % chars.length];
  }
  return result;
}

/**
 * Resolve a promise after a given delay.
 * Useful for simulating latency in dev or rate-limiting.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
