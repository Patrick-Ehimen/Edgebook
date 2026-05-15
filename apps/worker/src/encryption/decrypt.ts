import { createDecipheriv } from 'node:crypto';
import { env } from '../config/env';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');

/** Decrypts a value produced by the API's EncryptionService (iv:authTag:ciphertext in hex). */
export function decrypt(encoded: string): string {
  const parts = encoded.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted value format');
  const [ivHex, tagHex, ctHex] = parts as [string, string, string];
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const ct = Buffer.from(ctHex, 'hex');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error('Invalid encrypted value: bad iv or tag length');
  }
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ct) + decipher.final('utf8');
}
