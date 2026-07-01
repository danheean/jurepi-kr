import { describe, it, expect } from 'vitest';
import {
  parseQueryString,
  serializeQueryTable,
  editRow,
  deleteRow,
  addRow,
} from './query-parser';

describe('query-parser.ts', () => {
  describe('parseQueryString', () => {
    it('parses simple query string', () => {
      const result = parseQueryString('key=value');
      expect(result).toEqual([{ key: 'key', value: 'value' }]);
    });

    it('parses multiple parameters', () => {
      const result = parseQueryString('name=Alice&age=30&city=Seoul');
      expect(result).toEqual([
        { key: 'name', value: 'Alice' },
        { key: 'age', value: '30' },
        { key: 'city', value: 'Seoul' },
      ]);
    });

    it('strips leading ? from query string', () => {
      const result = parseQueryString('?key=value');
      expect(result).toEqual([{ key: 'key', value: 'value' }]);
    });

    it('handles empty values', () => {
      const result = parseQueryString('key1=&key2=value');
      expect(result).toEqual([
        { key: 'key1', value: '' },
        { key: 'key2', value: 'value' },
      ]);
    });

    it('handles parameters without values', () => {
      const result = parseQueryString('key1&key2=value');
      expect(result).toEqual([
        { key: 'key1', value: '' },
        { key: 'key2', value: 'value' },
      ]);
    });

    it('decodes percent-encoded keys and values', () => {
      const result = parseQueryString('name=%EC%95%88%EB%85%95&greeting=hello%20world');
      expect(result[0].key).toBe('name');
      expect(result[0].value).toBe('안녕');
      expect(result[1].value).toBe('hello world');
    });

    it('returns empty array for empty input', () => {
      const result = parseQueryString('');
      expect(result).toEqual([]);
    });

    it('returns empty array for whitespace only', () => {
      const result = parseQueryString('   ');
      expect(result).toEqual([]);
    });

    it('handles ? only', () => {
      const result = parseQueryString('?');
      expect(result).toEqual([]);
    });

    it('ignores trailing &', () => {
      const result = parseQueryString('key=value&');
      expect(result).toEqual([{ key: 'key', value: 'value' }]);
    });

    it('handles multiple = in value', () => {
      const result = parseQueryString('equation=a=b+c');
      expect(result).toEqual([{ key: 'equation', value: 'a=b+c' }]);
    });
  });

  describe('serializeQueryTable', () => {
    it('serializes single row', async () => {
      const rows = [{ key: 'name', value: 'Alice' }];
      const result = await serializeQueryTable(rows, 'component', 'utf-8');
      expect(result).toBe('name=Alice');
    });

    it('serializes multiple rows', async () => {
      const rows = [
        { key: 'name', value: 'Alice' },
        { key: 'age', value: '30' },
      ];
      const result = await serializeQueryTable(rows, 'component', 'utf-8');
      expect(result).toBe('name=Alice&age=30');
    });

    it('encodes special chars in component mode', async () => {
      const rows = [{ key: 'greeting', value: 'hello world' }];
      const result = await serializeQueryTable(rows, 'component', 'utf-8');
      expect(result).toContain('%20');
    });

    it('encodes UTF-8 non-ASCII chars', async () => {
      const rows = [{ key: 'name', value: '안녕' }];
      const result = await serializeQueryTable(rows, 'component', 'utf-8');
      expect(result).toContain('%EC');
    });

    it('encodes EUC-KR text', async () => {
      const rows = [{ key: 'name', value: '한글' }];
      const result = await serializeQueryTable(rows, 'component', 'euc-kr');
      expect(result).toBe('name=%C7%D1%B1%DB');
    });

    it('uses URI mode if specified', async () => {
      const rows = [{ key: 'url', value: 'https://example.com/path' }];
      const result = await serializeQueryTable(rows, 'uri', 'utf-8');
      expect(result).toContain('https://example.com/path');
    });

    it('handles empty rows', async () => {
      const result = await serializeQueryTable([], 'component', 'utf-8');
      expect(result).toBe('');
    });

    it('handles empty values', async () => {
      const rows = [{ key: 'key', value: '' }];
      const result = await serializeQueryTable(rows, 'component', 'utf-8');
      expect(result).toBe('key=');
    });
  });

  describe('editRow', () => {
    it('edits a row in place', () => {
      const rows = [
        { key: 'name', value: 'Alice' },
        { key: 'age', value: '30' },
      ];
      const edited = editRow(rows, 0, 'name', 'Bob');
      expect(edited[0]).toEqual({ key: 'name', value: 'Bob' });
      expect(edited[1]).toEqual({ key: 'age', value: '30' });
    });

    it('returns immutable copy', () => {
      const rows = [{ key: 'name', value: 'Alice' }];
      const edited = editRow(rows, 0, 'name', 'Bob');
      expect(rows).toEqual([{ key: 'name', value: 'Alice' }]); // Original unchanged
      expect(edited).toEqual([{ key: 'name', value: 'Bob' }]);
    });

    it('handles invalid index', () => {
      const rows = [{ key: 'name', value: 'Alice' }];
      expect(editRow(rows, 5, 'key', 'val')).toEqual(rows);
      expect(editRow(rows, -1, 'key', 'val')).toEqual(rows);
    });

    it('can change key and value', () => {
      const rows = [{ key: 'old', value: 'oldval' }];
      const edited = editRow(rows, 0, 'new', 'newval');
      expect(edited).toEqual([{ key: 'new', value: 'newval' }]);
    });
  });

  describe('deleteRow', () => {
    it('deletes a row', () => {
      const rows = [
        { key: 'name', value: 'Alice' },
        { key: 'age', value: '30' },
      ];
      const deleted = deleteRow(rows, 0);
      expect(deleted).toEqual([{ key: 'age', value: '30' }]);
    });

    it('returns immutable copy', () => {
      const rows = [{ key: 'name', value: 'Alice' }];
      const deleted = deleteRow(rows, 0);
      expect(rows).toEqual([{ key: 'name', value: 'Alice' }]); // Original unchanged
      expect(deleted).toEqual([]);
    });

    it('handles invalid index', () => {
      const rows = [{ key: 'name', value: 'Alice' }];
      expect(deleteRow(rows, 5)).toEqual(rows);
      expect(deleteRow(rows, -1)).toEqual(rows);
    });

    it('deletes correct row from multiple', () => {
      const rows = [
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
        { key: 'c', value: '3' },
      ];
      const deleted = deleteRow(rows, 1);
      expect(deleted).toEqual([
        { key: 'a', value: '1' },
        { key: 'c', value: '3' },
      ]);
    });
  });

  describe('addRow', () => {
    it('adds empty row to list', () => {
      const rows = [{ key: 'name', value: 'Alice' }];
      const added = addRow(rows);
      expect(added).toEqual([
        { key: 'name', value: 'Alice' },
        { key: '', value: '' },
      ]);
    });

    it('returns immutable copy', () => {
      const rows = [{ key: 'name', value: 'Alice' }];
      const added = addRow(rows);
      expect(rows).toEqual([{ key: 'name', value: 'Alice' }]); // Original unchanged
    });

    it('adds to empty list', () => {
      const rows: any[] = [];
      const added = addRow(rows);
      expect(added).toEqual([{ key: '', value: '' }]);
    });

    it('can add multiple rows', () => {
      let rows: any[] = [];
      rows = addRow(rows);
      rows = addRow(rows);
      expect(rows).toEqual([
        { key: '', value: '' },
        { key: '', value: '' },
      ]);
    });
  });

  describe('immutability', () => {
    it('all ops return new arrays', () => {
      const rows = [{ key: 'a', value: '1' }];
      const edited = editRow(rows, 0, 'b', '2');
      const deleted = deleteRow(rows, 0);
      const added = addRow(rows);

      expect(edited).not.toBe(rows);
      expect(deleted).not.toBe(rows);
      expect(added).not.toBe(rows);
    });

    it('preserves original on all ops', () => {
      const original = [
        { key: 'name', value: 'Alice' },
        { key: 'age', value: '30' },
      ];

      editRow(original, 0, 'newkey', 'newval');
      deleteRow(original, 0);
      addRow(original);

      expect(original).toEqual([
        { key: 'name', value: 'Alice' },
        { key: 'age', value: '30' },
      ]);
    });
  });

  describe('round-trip: parse → edit → serialize', () => {
    it('preserves original query on no edit', async () => {
      const input = 'name=Alice&age=30';
      const rows = parseQueryString(input);
      const serialized = await serializeQueryTable(rows, 'component', 'utf-8');
      expect(serialized).toBe(input);
    });

    it('round-trips with UTF-8', async () => {
      const input = 'greeting=%EC%95%88%EB%85%95&mood=%F0%9F%98%8A';
      const rows = parseQueryString(input);
      expect(rows[0].value).toBe('안녕');
      expect(rows[1].value).toBe('😊');

      const edited = editRow(rows, 0, 'greeting', '안녕하세요');
      const serialized = await serializeQueryTable(edited, 'component', 'utf-8');
      // Just verify that the value is properly encoded (not checking exact hex)
      expect(serialized).toContain('greeting=');
      expect(serialized).not.toContain('안');
      expect(serialized).not.toContain('녕');
    });
  });
});
