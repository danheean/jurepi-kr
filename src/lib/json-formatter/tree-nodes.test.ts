import { describe, it, expect } from 'vitest';
import { jsonToTreeNodes } from './tree-nodes';

describe('tree-nodes.ts', () => {
  describe('jsonToTreeNodes', () => {
    it('creates node for null value', () => {
      const node = jsonToTreeNodes(null);
      expect(node.type).toBe('null');
      expect(node.value).toBe(null);
      expect(node.depth).toBe(0);
    });

    it('creates node for boolean values', () => {
      const trueNode = jsonToTreeNodes(true);
      expect(trueNode.type).toBe('boolean');
      expect(trueNode.value).toBe(true);

      const falseNode = jsonToTreeNodes(false);
      expect(falseNode.type).toBe('boolean');
      expect(falseNode.value).toBe(false);
    });

    it('creates node for numbers', () => {
      const node = jsonToTreeNodes(42);
      expect(node.type).toBe('number');
      expect(node.value).toBe(42);
    });

    it('creates node for strings', () => {
      const node = jsonToTreeNodes('hello');
      expect(node.type).toBe('string');
      expect(node.value).toBe('hello');
    });

    it('creates node for arrays', () => {
      const arr = [1, 2, 3];
      const node = jsonToTreeNodes(arr);
      expect(node.type).toBe('array');
      expect(node.value).toBe('Array(3)');
      expect(node.children).toHaveLength(3);
      expect(node.children![0].type).toBe('number');
      expect(node.children![0].value).toBe(1);
    });

    it('creates node for objects', () => {
      const obj = { name: 'John', age: 30 };
      const node = jsonToTreeNodes(obj);
      expect(node.type).toBe('object');
      expect(node.value).toBe('Object(2)');
      expect(node.children).toHaveLength(2);
    });

    it('assigns correct keys to object properties', () => {
      const obj = { name: 'John', age: 30 };
      const node = jsonToTreeNodes(obj);
      const keys = node.children!.map(child => child.key).sort();
      expect(keys).toEqual(['age', 'name']);
    });

    it('assigns correct indices to array items', () => {
      const arr = ['a', 'b', 'c'];
      const node = jsonToTreeNodes(arr);
      expect(node.children![0].key).toBe('[0]');
      expect(node.children![1].key).toBe('[1]');
      expect(node.children![2].key).toBe('[2]');
    });

    it('tracks depth correctly', () => {
      const obj = { nested: { deep: [1, 2] } };
      const node = jsonToTreeNodes(obj);
      expect(node.depth).toBe(0);
      expect(node.children![0].depth).toBe(1);
      expect(node.children![0].children![0].depth).toBe(2);
      expect(node.children![0].children![0].children![0].depth).toBe(3);
    });

    it('handles complex nested structures', () => {
      const json = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        count: 2,
      };
      const node = jsonToTreeNodes(json);
      expect(node.type).toBe('object');
      expect(node.children).toHaveLength(2);

      const usersNode = node.children!.find(c => c.key === 'users')!;
      expect(usersNode.type).toBe('array');
      expect(usersNode.children).toHaveLength(2);
    });

    it('accepts key parameter for root node', () => {
      const node = jsonToTreeNodes({ a: 1 }, 0, 'root');
      expect(node.key).toBe('root');
    });

    it('accepts depth parameter', () => {
      const node = jsonToTreeNodes(42, 5);
      expect(node.depth).toBe(5);
    });

    it('handles empty objects and arrays', () => {
      const emptyObj = jsonToTreeNodes({});
      expect(emptyObj.type).toBe('object');
      expect(emptyObj.value).toBe('Object(0)');
      expect(emptyObj.children).toHaveLength(0);

      const emptyArr = jsonToTreeNodes([]);
      expect(emptyArr.type).toBe('array');
      expect(emptyArr.value).toBe('Array(0)');
      expect(emptyArr.children).toHaveLength(0);
    });
  });
});
