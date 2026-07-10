/**
 * Supported JWT signing algorithms
 */
export const SUPPORTED_ALGS = ['HS256', 'HS384', 'HS512', 'RS256', 'ES256'] as const;

export type SupportedAlg = (typeof SUPPORTED_ALGS)[number];

/**
 * Verification result (discriminated union)
 */
export type VerificationResult =
  | { verified: true }
  | { verified: false; error: string; code?: string };

/**
 * Decode base64url to Uint8Array
 */
function base64UrlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = b64.length % 4;
  if (padding) {
    b64 += '='.repeat(4 - padding);
  }
  const binaryStr = atob(b64);
  const buffer = new ArrayBuffer(binaryStr.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Verify a JWT signature
 * Supports HMAC (HS256/384/512) and RSA (RS256) and ECDSA (ES256)
 * @param input - { alg, signingInput (header.payload), signatureB64Url, secret?, publicKeyPem? }
 * @param deps - { subtle?: SubtleCrypto } for injecting test mocks
 */
export async function verifySignature(
  input: {
    alg: string;
    signingInput: string;
    signatureB64Url: string;
    secret?: string;
    publicKeyPem?: string;
  },
  deps?: {
    subtle?: SubtleCrypto;
  }
): Promise<VerificationResult> {
  const { alg, signingInput, signatureB64Url, secret, publicKeyPem } = input;
  const subtle = deps?.subtle ?? globalThis.crypto?.subtle;

  if (!subtle) {
    return {
      verified: false,
      error: 'WebCrypto (crypto.subtle) not available',
    };
  }

  // Check if algorithm is supported
  if (!SUPPORTED_ALGS.includes(alg as SupportedAlg)) {
    return {
      verified: false,
      error: `Unsupported algorithm '${alg}'. Supported: ${SUPPORTED_ALGS.join(', ')}`,
      code: 'unsupported_alg',
    };
  }

  // Route based on algorithm
  if (alg.startsWith('HS')) {
    return verifyHMAC(alg, signingInput, signatureB64Url, secret, subtle);
  } else if (alg === 'RS256') {
    return verifyRSA(signingInput, signatureB64Url, publicKeyPem, subtle);
  } else if (alg === 'ES256') {
    return verifyECDSA(signingInput, signatureB64Url, publicKeyPem, subtle);
  }

  return {
    verified: false,
    error: 'Unknown algorithm',
  };
}

/**
 * Verify HMAC signature (HS256/384/512)
 */
async function verifyHMAC(
  alg: string,
  signingInput: string,
  signatureB64Url: string,
  secret: string | undefined,
  subtle: SubtleCrypto
): Promise<VerificationResult> {
  if (!secret) {
    return {
      verified: false,
      error: 'Secret required for HMAC verification',
      code: 'secret_error',
    };
  }

  try {
    // Determine hash algorithm
    const hashAlg =
      alg === 'HS256'
        ? 'SHA-256'
        : alg === 'HS384'
          ? 'SHA-384'
          : alg === 'HS512'
            ? 'SHA-512'
            : null;

    if (!hashAlg) {
      return {
        verified: false,
        error: `Invalid HMAC algorithm: ${alg}`,
      };
    }

    // Import secret as key
    const key = await subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: hashAlg },
      false,
      ['sign']
    );

    // Decode signature
    const signatureBytes = base64UrlToBytes(signatureB64Url);

    // Verify
    const verified = await subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(signingInput)
    );

    return verified
      ? { verified: true }
      : {
          verified: false,
          error: 'Signature verification failed.',
          code: 'verification_failed',
        };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      verified: false,
      error: message,
      code: 'secret_error',
    };
  }
}

/**
 * Verify RSA signature (RS256)
 */
async function verifyRSA(
  signingInput: string,
  signatureB64Url: string,
  publicKeyPem: string | undefined,
  subtle: SubtleCrypto
): Promise<VerificationResult> {
  if (!publicKeyPem) {
    return {
      verified: false,
      error: 'Public key required for RSA verification',
      code: 'secret_error',
    };
  }

  try {
    // Parse PEM
    const keyData = extractPemBase64(publicKeyPem);
    if (!keyData) {
      return {
        verified: false,
        error: 'Invalid public key format',
        code: 'invalid_pem',
      };
    }

    // Import key
    const key = await subtle.importKey(
      'spki',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode signature
    const signatureBytes = base64UrlToBytes(signatureB64Url);

    // Verify
    const verified = await subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signatureBytes,
      new TextEncoder().encode(signingInput)
    );

    return verified
      ? { verified: true }
      : {
          verified: false,
          error: 'Signature verification failed.',
          code: 'verification_failed',
        };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      verified: false,
      error: message,
      code: 'secret_error',
    };
  }
}

/**
 * Verify ECDSA signature (ES256)
 */
async function verifyECDSA(
  signingInput: string,
  signatureB64Url: string,
  publicKeyPem: string | undefined,
  subtle: SubtleCrypto
): Promise<VerificationResult> {
  if (!publicKeyPem) {
    return {
      verified: false,
      error: 'Public key required for ECDSA verification',
      code: 'secret_error',
    };
  }

  try {
    // Parse PEM
    const keyData = extractPemBase64(publicKeyPem);
    if (!keyData) {
      return {
        verified: false,
        error: 'Invalid public key format',
        code: 'invalid_pem',
      };
    }

    // Import key
    const key = await subtle.importKey(
      'spki',
      keyData,
      { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode signature (raw r||s format, 64 bytes)
    const signatureBytes = base64UrlToBytes(signatureB64Url);

    // Verify
    const verified = await subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      signatureBytes,
      new TextEncoder().encode(signingInput)
    );

    return verified
      ? { verified: true }
      : {
          verified: false,
          error: 'Signature verification failed.',
          code: 'verification_failed',
        };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      verified: false,
      error: message,
      code: 'secret_error',
    };
  }
}

/**
 * Extract base64 data from PEM format
 */
function extractPemBase64(pem: string): Uint8Array<ArrayBuffer> | null {
  const beginMarker = '-----BEGIN PUBLIC KEY-----';
  const endMarker = '-----END PUBLIC KEY-----';

  const beginIdx = pem.indexOf(beginMarker);
  const endIdx = pem.indexOf(endMarker);

  if (beginIdx === -1 || endIdx === -1 || beginIdx >= endIdx) {
    return null;
  }

  const b64Content = pem
    .substring(beginIdx + beginMarker.length, endIdx)
    .replace(/\s/g, '');

  try {
    // Decode base64
    const binaryStr = atob(b64Content);
    const buffer = new ArrayBuffer(binaryStr.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}
