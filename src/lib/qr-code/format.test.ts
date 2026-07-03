import { describe, it, expect } from 'vitest';
import { formatData } from './format';
import type { WifiFields, VcardFields, EmailFields, SmsFields } from './types';

describe('format.ts', () => {
  describe('text mode', () => {
    it('returns plain text as-is', () => {
      expect(formatData('text', 'Hello World')).toBe('Hello World');
    });

    it('preserves special characters', () => {
      expect(formatData('text', 'hello@world.com;123:456')).toBe('hello@world.com;123:456');
    });

    it('handles empty strings', () => {
      expect(formatData('text', '')).toBe('');
    });

    it('preserves newlines in text', () => {
      expect(formatData('text', 'line1\nline2')).toBe('line1\nline2');
    });
  });

  describe('url mode', () => {
    it('returns URL as-is', () => {
      expect(formatData('url', 'https://jurepi.kr')).toBe('https://jurepi.kr');
    });

    it('preserves query parameters', () => {
      const url = 'https://example.com?foo=bar&baz=qux';
      expect(formatData('url', url)).toBe(url);
    });

    it('preserves fragments', () => {
      const url = 'https://example.com#section';
      expect(formatData('url', url)).toBe(url);
    });
  });

  describe('wifi mode', () => {
    it('formats WPA network without password', () => {
      const fields: WifiFields = {
        ssid: 'MyNetwork',
        password: 'mypassword',
        encryption: 'WPA',
      };
      expect(formatData('wifi', fields)).toBe('WIFI:T:WPA;S:MyNetwork;P:mypassword;;');
    });

    it('formats WEP network', () => {
      const fields: WifiFields = {
        ssid: 'OldNetwork',
        password: 'oldpass',
        encryption: 'WEP',
      };
      expect(formatData('wifi', fields)).toBe('WIFI:T:WEP;S:OldNetwork;P:oldpass;;');
    });

    it('escapes semicolons in SSID', () => {
      const fields: WifiFields = {
        ssid: 'Network;Name',
        password: 'pass',
        encryption: 'WPA',
      };
      expect(formatData('wifi', fields)).toBe('WIFI:T:WPA;S:Network\\;Name;P:pass;;');
    });

    it('escapes colons in password', () => {
      const fields: WifiFields = {
        ssid: 'Network',
        password: 'pass:word',
        encryption: 'WPA',
      };
      expect(formatData('wifi', fields)).toBe('WIFI:T:WPA;S:Network;P:pass\\:word;;');
    });

    it('escapes backslashes in SSID and password', () => {
      const fields: WifiFields = {
        ssid: 'Net\\work',
        password: 'pass\\word',
        encryption: 'WPA',
      };
      expect(formatData('wifi', fields)).toBe('WIFI:T:WPA;S:Net\\\\work;P:pass\\\\word;;');
    });

    it('escapes quotes in SSID', () => {
      const fields: WifiFields = {
        ssid: 'Net"work',
        password: 'pass',
        encryption: 'WPA',
      };
      expect(formatData('wifi', fields)).toBe('WIFI:T:WPA;S:Net\\"work;P:pass;;');
    });

    it('handles nopass encryption', () => {
      const fields: WifiFields = {
        ssid: 'OpenNetwork',
        password: '',
        encryption: 'nopass',
      };
      // nopass is not WEP or WPA, so it defaults to WPA
      expect(formatData('wifi', fields)).toBe('WIFI:T:WPA;S:OpenNetwork;P:;;');
    });
  });

  describe('vcard mode', () => {
    it('formats name only', () => {
      const fields: VcardFields = { name: 'John Doe' };
      const result = formatData('vcard', fields);
      expect(result).toContain('BEGIN:VCARD');
      expect(result).toContain('VERSION:3.0');
      expect(result).toContain('FN:John Doe');
      expect(result).toContain('END:VCARD');
      expect(result).toMatch(/\r\n/);
    });

    it('includes phone when provided', () => {
      const fields: VcardFields = {
        name: 'John Doe',
        phone: '+1234567890',
      };
      const result = formatData('vcard', fields);
      expect(result).toContain('TEL:+1234567890');
    });

    it('includes email when provided', () => {
      const fields: VcardFields = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      const result = formatData('vcard', fields);
      expect(result).toContain('EMAIL:john@example.com');
    });

    it('includes url when provided', () => {
      const fields: VcardFields = {
        name: 'John Doe',
        url: 'https://example.com',
      };
      const result = formatData('vcard', fields);
      expect(result).toContain('URL:https://example.com');
    });

    it('includes all fields when all provided', () => {
      const fields: VcardFields = {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        url: 'https://example.com',
      };
      const result = formatData('vcard', fields);
      expect(result).toContain('FN:John Doe');
      expect(result).toContain('TEL:+1234567890');
      expect(result).toContain('EMAIL:john@example.com');
      expect(result).toContain('URL:https://example.com');
    });

    it('escapes semicolons in name', () => {
      const fields: VcardFields = {
        name: 'Doe;John',
      };
      const result = formatData('vcard', fields);
      expect(result).toContain('FN:Doe\\;John');
    });

    it('escapes newlines in email', () => {
      const fields: VcardFields = {
        name: 'John',
        email: 'john\nmail@example.com',
      };
      const result = formatData('vcard', fields);
      // The escape function replaces actual \n with \\ followed by n
      expect(result).toContain('EMAIL:john\\');
      expect(result).toContain('mail@example.com');
    });
  });

  describe('email mode', () => {
    it('formats email address only', () => {
      const fields: EmailFields = { email: 'test@example.com' };
      expect(formatData('email', fields)).toBe('mailto:test@example.com');
    });

    it('includes subject when provided', () => {
      const fields: EmailFields = {
        email: 'test@example.com',
        subject: 'Hello World',
      };
      expect(formatData('email', fields)).toBe('mailto:test@example.com?subject=Hello+World');
    });

    it('includes body when provided', () => {
      const fields: EmailFields = {
        email: 'test@example.com',
        body: 'This is a message',
      };
      expect(formatData('email', fields)).toBe('mailto:test@example.com?body=This+is+a+message');
    });

    it('includes subject and body when both provided', () => {
      const fields: EmailFields = {
        email: 'test@example.com',
        subject: 'Hello',
        body: 'Message',
      };
      expect(formatData('email', fields)).toBe('mailto:test@example.com?subject=Hello&body=Message');
    });

    it('URL-encodes subject with special characters', () => {
      const fields: EmailFields = {
        email: 'test@example.com',
        subject: 'Hello & goodbye',
      };
      expect(formatData('email', fields)).toBe('mailto:test@example.com?subject=Hello+%26+goodbye');
    });

    it('URL-encodes body with newlines', () => {
      const fields: EmailFields = {
        email: 'test@example.com',
        body: 'Line 1\nLine 2',
      };
      expect(formatData('email', fields)).toBe('mailto:test@example.com?body=Line+1%0ALine+2');
    });
  });

  describe('sms mode', () => {
    it('formats phone number only', () => {
      const fields: SmsFields = { phone: '+1234567890' };
      expect(formatData('sms', fields)).toBe('smsto:+1234567890:');
    });

    it('includes message when provided', () => {
      const fields: SmsFields = {
        phone: '+1234567890',
        message: 'Hello',
      };
      expect(formatData('sms', fields)).toBe('smsto:+1234567890:Hello');
    });

    it('URL-encodes message with spaces', () => {
      const fields: SmsFields = {
        phone: '+1234567890',
        message: 'Hello World',
      };
      expect(formatData('sms', fields)).toBe('smsto:+1234567890:Hello%20World');
    });

    it('URL-encodes message with special characters', () => {
      const fields: SmsFields = {
        phone: '+1234567890',
        message: 'Hello & goodbye',
      };
      expect(formatData('sms', fields)).toBe('smsto:+1234567890:Hello%20%26%20goodbye');
    });
  });

  describe('unknown mode', () => {
    it('throws error for unknown mode', () => {
      expect(() => formatData('unknown' as any, '')).toThrow();
    });
  });
});
