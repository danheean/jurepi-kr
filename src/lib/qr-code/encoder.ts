import QRCode from 'qrcode';
import type { ECCLevel } from './types';

export class QREncodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QREncodingError';
  }
}

/**
 * Encodes data into QR matrix using qrcode library.
 * @param data - QR-encodable string (already formatted per mode)
 * @param eccLevel - Error correction level (L, M, Q, H)
 * @returns boolean[][] matrix (true = black module, false = white)
 * @throws QREncodingError if data is empty or exceeds capacity
 */
export function encodeQRMatrix(
  data: string,
  eccLevel: ECCLevel = 'M'
): boolean[][] {
  if (!data || data.trim().length === 0) {
    throw new QREncodingError('QR data cannot be empty');
  }

  try {
    const qr = QRCode.create(data, {
      errorCorrectionLevel: eccLevel,
    });

    // Extract module matrix from qr object
    // qr.modules is a BitMatrix object with .get(row, col) method
    // .size gives the dimension (modules are square)
    const size = qr.modules.size;
    const matrix: boolean[][] = [];

    for (let row = 0; row < size; row++) {
      const rowData: boolean[] = [];
      for (let col = 0; col < size; col++) {
        // .get(row, col) returns 0 or 1 (0 = white, 1 = black)
        const module = qr.modules.get(row, col);
        rowData.push(module === 1);
      }
      matrix.push(rowData);
    }

    return matrix;
  } catch (err: unknown) {
    // If it's already our typed error, re-throw
    if (err instanceof QREncodingError) {
      throw err;
    }

    const message = err instanceof Error ? err.message : String(err);
    throw new QREncodingError(`Failed to encode QR: ${message}`);
  }
}
