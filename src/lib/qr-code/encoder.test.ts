import { describe, it, expect } from 'vitest';
import { encodeQRMatrix, QREncodingError } from './encoder';

describe('encoder.ts', () => {
  describe('encodeQRMatrix', () => {
    it('encodes simple text to matrix', () => {
      const matrix = encodeQRMatrix('Hello');
      expect(Array.isArray(matrix)).toBe(true);
      expect(matrix.length > 0).toBe(true);
      expect(Array.isArray(matrix[0])).toBe(true);
      // First element should be boolean
      expect(typeof matrix[0][0]).toBe('boolean');
    });

    it('returns square matrix', () => {
      const matrix = encodeQRMatrix('Test');
      const size = matrix.length;
      expect(matrix.every((row) => row.length === size)).toBe(true);
    });

    it('respects error correction level L', () => {
      const matrixL = encodeQRMatrix('Test data', 'L');
      expect(matrixL.length > 0).toBe(true);
    });

    it('respects error correction level M', () => {
      const matrixM = encodeQRMatrix('Test data', 'M');
      expect(matrixM.length > 0).toBe(true);
    });

    it('respects error correction level Q', () => {
      const matrixQ = encodeQRMatrix('Test data', 'Q');
      expect(matrixQ.length > 0).toBe(true);
    });

    it('respects error correction level H', () => {
      const matrixH = encodeQRMatrix('Test data', 'H');
      expect(matrixH.length > 0).toBe(true);
    });

    it('produces consistent results for same input', () => {
      const data = 'Deterministic Test';
      const matrix1 = encodeQRMatrix(data);
      const matrix2 = encodeQRMatrix(data);
      expect(matrix1).toEqual(matrix2);
    });

    it('produces different matrices for different inputs', () => {
      const matrix1 = encodeQRMatrix('Input 1');
      const matrix2 = encodeQRMatrix('Input 2');
      expect(matrix1).not.toEqual(matrix2);
    });

    it('produces larger matrix for longer input', () => {
      const shortMatrix = encodeQRMatrix('Short');
      const longMatrix = encodeQRMatrix('This is a much longer input that should require a bigger QR code');
      expect(longMatrix.length).toBeGreaterThanOrEqual(shortMatrix.length);
    });

    it('higher ECC produces larger matrix', () => {
      const shortEcc = encodeQRMatrix('Same input', 'L');
      const longEcc = encodeQRMatrix('Same input', 'H');
      expect(longEcc.length).toBeGreaterThanOrEqual(shortEcc.length);
    });

    it('throws QREncodingError on empty string', () => {
      expect(() => encodeQRMatrix('')).toThrow(QREncodingError);
    });

    it('throws QREncodingError on whitespace-only string', () => {
      expect(() => encodeQRMatrix('   ')).toThrow(QREncodingError);
    });

    it('throws QREncodingError on too-long input', () => {
      const tooLong = 'a'.repeat(3000);
      expect(() => encodeQRMatrix(tooLong)).toThrow(QREncodingError);
    });

    it('handles unicode text', () => {
      const matrix = encodeQRMatrix('안녕하세요');
      expect(matrix.length > 0).toBe(true);
    });

    it('handles emoji', () => {
      const matrix = encodeQRMatrix('Hello 😊 World');
      expect(matrix.length > 0).toBe(true);
    });

    it('handles special characters', () => {
      const matrix = encodeQRMatrix('!@#$%^&*()_+-=[]{}|;:,.<>?');
      expect(matrix.length > 0).toBe(true);
    });

    it('handles URLs', () => {
      const matrix = encodeQRMatrix('https://jurepi.kr?foo=bar&baz=qux#section');
      expect(matrix.length > 0).toBe(true);
    });

    it('QREncodingError has correct name and message', () => {
      try {
        encodeQRMatrix('');
      } catch (err) {
        expect(err).toBeInstanceOf(QREncodingError);
        expect((err as Error).name).toBe('QREncodingError');
        expect((err as Error).message).toBeTruthy();
      }
    });

    it('finder pattern (QR corner) is present', () => {
      const matrix = encodeQRMatrix('Test');
      // Finder pattern is 7x7 black square at corners
      // Top-left corner should have black modules (true values)
      expect(matrix[0][0]).toBe(true);
      expect(matrix[0][1]).toBe(true);
      expect(matrix[1][0]).toBe(true);
    });

    it('defaults to M error correction', () => {
      const withoutEcc = encodeQRMatrix('Test');
      const withM = encodeQRMatrix('Test', 'M');
      expect(withoutEcc).toEqual(withM);
    });
  });

  describe('QREncodingError', () => {
    it('is an Error subclass', () => {
      const err = new QREncodingError('test');
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('QREncodingError');
      expect(err.message).toBe('test');
    });
  });
});
