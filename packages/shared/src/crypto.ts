import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm' as const;

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('TOKEN_ENCRYPTION_KEY is required');
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (base64-encoded)');
  }

  return key;
}

export type EncryptedString = {
  v: 1;
  iv: string; // base64
  tag: string; // base64
  data: string; // base64
};

export function encryptString(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedString = {
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
  };

  return JSON.stringify(payload);
}

export function decryptString(payloadJson: string): string {
  const parsed = JSON.parse(payloadJson) as EncryptedString;
  if (!parsed || parsed.v !== 1) {
    throw new Error('Unsupported encrypted payload');
  }

  const key = getKey();
  const iv = Buffer.from(parsed.iv, 'base64');
  const tag = Buffer.from(parsed.tag, 'base64');
  const data = Buffer.from(parsed.data, 'base64');

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
}
