/**
 * Zero-Knowledge End-to-End Encryption (E2EE) Utility
 * 
 * Uses standard Web Crypto API (PBKDF2 + AES-GCM 256-bit).
 * Passphrases are never sent to any server.
 */

const E2EE_PREFIX = 'e2ee:v1:';
const PBKDF2_ITERATIONS = 100000;
const SESSION_STORAGE_KEY = 'sanctuary_e2ee_session_key';

// In-memory fallback if sessionStorage is restricted
let inMemoryPassphrase: string | null = null;

export function getSessionPassphrase(): string | null {
  if (inMemoryPassphrase) return inMemoryPassphrase;
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSessionPassphrase(passphrase: string): void {
  inMemoryPassphrase = passphrase;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, passphrase);
  } catch {
    // SessionStorage unavailable
  }
}

export function clearSessionPassphrase(): void {
  inMemoryPassphrase = null;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // SessionStorage unavailable
  }
}

/**
 * Derives an AES-GCM-256 key from a passphrase and salt using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passphraseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Helper: Uint8Array to base64
function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return window.btoa(binary);
}

// Helper: base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt arbitrary JSON serializable data using AES-GCM 256-bit
 * Returns payload: "e2ee:v1:" + base64(salt[16] + iv[12] + ciphertext)
 */
export async function encryptPayload<T>(data: T, passphrase: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const jsonStr = JSON.stringify(data);
  const encoded = new TextEncoder().encode(jsonStr);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoded
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);

  // Combine: 16-byte salt + 12-byte IV + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);

  return `${E2EE_PREFIX}${bufferToBase64(combined)}`;
}

/**
 * Decrypts payload that was encrypted with encryptPayload
 * Throws an error if passphrase is wrong or payload is tampered
 */
export async function decryptPayload<T>(payload: string, passphrase: string): Promise<T> {
  if (!payload.startsWith(E2EE_PREFIX)) {
    throw new Error('Unrecognized encryption format or version.');
  }

  const base64Data = payload.slice(E2EE_PREFIX.length);
  const combined = base64ToBuffer(base64Data);

  if (combined.length < 16 + 12 + 1) {
    throw new Error('Encrypted payload is corrupted or too short.');
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    const decryptedStr = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedStr) as T;
  } catch {
    throw new Error('Incorrect passphrase or unable to decrypt this entry.');
  }
}
