/**
 * auth.ts — Authentication and cryptography for the Error404 bot.
 *
 * Provides:
 *  - JWT API key generation / validation (for web-to-bot auth)
 *  - AES-256-GCM encryption / decryption of private keys
 *
 * Security notes:
 *  - Keys are NEVER written to disk. Only stored in the in-memory `keyStore` Map.
 *  - `ENCRYPTION_SECRET` should be a random 32-byte string set in .env
 *  - GCM mode provides authenticated encryption — tampered ciphertext is rejected.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { SignJWT, jwtVerify }                             from "jose";

// ─── In-memory key store ──────────────────────────────────────────────────────
// Maps Telegram userId (number) → AES-256-GCM encrypted private key (hex string)
// Cleared on process restart.

const keyStore = new Map<number, string>();

// ─── JWT helpers ──────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-jwt-secret"
);

/**
 * Generate a signed JWT API key for a Telegram user.
 * @param userId  Telegram numeric user ID
 * @returns       JWT string, valid 90 days
 */
export async function generateApiKey(userId: number): Promise<string> {
  return new SignJWT({ telegramId: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(JWT_SECRET);
}

/**
 * Validate an API key JWT.
 * @returns userId number if valid, or null if expired / invalid
 */
export async function validateApiKey(key: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(key, JWT_SECRET);
    return Number(payload.sub);
  } catch {
    return null;
  }
}

// ─── AES-256-GCM encryption ───────────────────────────────────────────────────

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET ?? "change-me-32-chars-random-string";
  // Derive a 32-byte key by padding/trimming the secret
  return Buffer.from(secret.padEnd(32, "0").slice(0, 32), "utf8");
}

/**
 * Encrypt a private key with AES-256-GCM.
 * Returns: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encryptKey(privateKey: string): string {
  const iv         = randomBytes(12);          // 96-bit IV for GCM
  const cipher     = createCipheriv(ALGO, getKey(), iv);
  const encrypted  = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt an AES-256-GCM encrypted private key.
 * Throws if the ciphertext has been tampered with (authTag mismatch).
 */
export function decryptKey(encrypted: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Invalid encrypted key format");
  }
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// ─── Key store helpers ────────────────────────────────────────────────────────

/** Store an encrypted private key for a user. */
export function storeKey(userId: number, privateKey: string): void {
  keyStore.set(userId, encryptKey(privateKey));
}

/** Retrieve and decrypt a user's private key. Returns null if not found. */
export function getKey2(userId: number): string | null {
  const enc = keyStore.get(userId);
  if (!enc) return null;
  return decryptKey(enc);
}

/** Returns a masked representation: 0xABCD…WXYZ */
export function maskKey(privateKey: string): string {
  if (privateKey.length < 12) return "****";
  return `${privateKey.slice(0, 6)}…${privateKey.slice(-4)}`;
}

/** Check if a user has a stored key */
export function hasKey(userId: number): boolean {
  return keyStore.has(userId);
}
