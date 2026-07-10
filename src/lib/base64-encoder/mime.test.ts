import { describe, it, expect } from 'vitest';
import { guessMimeType, isTextualMime, extensionForMime } from './mime';

describe('guessMimeType', () => {
  describe('by data-URI prefix', () => {
    it('should extract MIME type from data-URI prefix', () => {
      const prefix = 'data:image/png;base64,';
      expect(guessMimeType(undefined, prefix)).toBe('image/png');
    });

    it('should extract MIME type without base64 encoding', () => {
      const prefix = 'data:application/json;charset=utf-8,';
      expect(guessMimeType(undefined, prefix)).toBe('application/json');
    });

    it('should handle data-URI with charset parameter', () => {
      const prefix = 'data:text/html;charset=utf-8;base64,';
      expect(guessMimeType(undefined, prefix)).toBe('text/html');
    });
  });

  describe('by file extension', () => {
    it('should recognize .pdf', () => {
      expect(guessMimeType('document.pdf')).toBe('application/pdf');
    });

    it('should recognize .png', () => {
      expect(guessMimeType('image.png')).toBe('image/png');
    });

    it('should recognize .jpg', () => {
      expect(guessMimeType('photo.jpg')).toBe('image/jpeg');
    });

    it('should recognize .jpeg', () => {
      expect(guessMimeType('photo.jpeg')).toBe('image/jpeg');
    });

    it('should recognize .gif', () => {
      expect(guessMimeType('animation.gif')).toBe('image/gif');
    });

    it('should recognize .txt', () => {
      expect(guessMimeType('readme.txt')).toBe('text/plain');
    });

    it('should recognize .csv', () => {
      expect(guessMimeType('data.csv')).toBe('text/csv');
    });

    it('should recognize .json', () => {
      expect(guessMimeType('config.json')).toBe('application/json');
    });

    it('should recognize .xml', () => {
      expect(guessMimeType('data.xml')).toBe('application/xml');
    });

    it('should recognize .zip', () => {
      expect(guessMimeType('archive.zip')).toBe('application/zip');
    });

    it('should recognize .doc', () => {
      expect(guessMimeType('document.doc')).toBe('application/msword');
    });

    it('should recognize .docx', () => {
      expect(guessMimeType('document.docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    });

    it('should recognize .xls', () => {
      expect(guessMimeType('sheet.xls')).toBe('application/vnd.ms-excel');
    });

    it('should recognize .xlsx', () => {
      expect(guessMimeType('sheet.xlsx')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    });

    it('should be case-insensitive', () => {
      expect(guessMimeType('DOCUMENT.PDF')).toBe('application/pdf');
      expect(guessMimeType('IMAGE.PNG')).toBe('image/png');
    });

    it('should handle filenames with multiple dots', () => {
      expect(guessMimeType('archive.tar.gz')).toBe('application/gzip');
      expect(guessMimeType('backup.backup.zip')).toBe('application/zip');
    });
  });

  describe('fallback', () => {
    it('should return text/plain for unknown extension', () => {
      expect(guessMimeType('unknown.xyz')).toBe('text/plain');
    });

    it('should return text/plain when no filename provided', () => {
      expect(guessMimeType()).toBe('text/plain');
    });

    it('should return text/plain when neither filename nor prefix provided', () => {
      expect(guessMimeType(undefined, undefined)).toBe('text/plain');
    });

    it('should prefer filename over no prefix', () => {
      expect(guessMimeType('image.png', undefined)).toBe('image/png');
    });

    it('should prefer data-URI prefix over filename', () => {
      // If both provided, prefix might take precedence
      const result = guessMimeType('document.pdf', 'data:image/png;base64,');
      expect(result).toBe('image/png');
    });
  });

  describe('edge cases', () => {
    it('should handle filename without extension', () => {
      expect(guessMimeType('README')).toBe('text/plain');
    });

    it('should handle empty extension', () => {
      expect(guessMimeType('file.')).toBe('text/plain');
    });

    it('should handle path with directory', () => {
      expect(guessMimeType('/path/to/image.png')).toBe('image/png');
    });

    it('should handle Windows path with backslash', () => {
      expect(guessMimeType('C:\\Users\\image.png')).toBe('image/png');
    });

    it('should handle data-URI with partial prefix', () => {
      expect(guessMimeType(undefined, 'data:text/html')).toBe('text/html');
    });
  });
});

describe('isTextualMime', () => {
  it('treats text/* and text-ish application types as textual', () => {
    expect(isTextualMime('text/plain')).toBe(true);
    expect(isTextualMime('text/html')).toBe(true);
    expect(isTextualMime('application/json')).toBe(true);
    expect(isTextualMime('application/xml')).toBe(true);
    expect(isTextualMime('application/ld+json')).toBe(true);
    expect(isTextualMime('image/svg+xml')).toBe(true);
  });

  it('treats binary types as non-textual', () => {
    expect(isTextualMime('application/pdf')).toBe(false);
    expect(isTextualMime('application/zip')).toBe(false);
    expect(isTextualMime('image/png')).toBe(false);
    expect(isTextualMime('audio/mpeg')).toBe(false);
    expect(isTextualMime('application/octet-stream')).toBe(false);
  });
});

describe('extensionForMime', () => {
  it('maps known MIME types to a filename extension', () => {
    expect(extensionForMime('application/pdf')).toBe('pdf');
    expect(extensionForMime('application/zip')).toBe('zip');
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('audio/mpeg')).toBe('mp3');
  });

  it('falls back to "bin" for unknown MIME types', () => {
    expect(extensionForMime('application/octet-stream')).toBe('bin');
    expect(extensionForMime('application/x-unknown')).toBe('bin');
  });
});
