/**
 * Parse a PEM-formatted public key and extract the raw key data
 */
export function parsePemPublicKey(pem: string): { keyData: Uint8Array<ArrayBuffer> } | { error: string } {
  const beginMarker = '-----BEGIN PUBLIC KEY-----';
  const endMarker = '-----END PUBLIC KEY-----';

  const beginIdx = pem.indexOf(beginMarker);
  const endIdx = pem.indexOf(endMarker);

  if (beginIdx === -1 || endIdx === -1 || beginIdx >= endIdx) {
    return {
      error: 'Invalid public key. Could not parse PEM format. Ensure the key starts with \'-----BEGIN PUBLIC KEY-----\'.',
    };
  }

  // Extract base64 content between markers
  const b64Content = pem
    .substring(beginIdx + beginMarker.length, endIdx)
    .replace(/\s/g, ''); // Remove all whitespace

  if (!b64Content) {
    return {
      error: 'Invalid public key. PEM markers found but no content between them.',
    };
  }

  try {
    // Decode base64 to bytes
    const binaryStr = atob(b64Content);
    const buffer = new ArrayBuffer(binaryStr.length);
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    return { keyData: bytes };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid base64 in PEM';
    return {
      error: `Could not decode PEM content: ${message}`,
    };
  }
}
