import type {
  InputMode,
  WifiFields,
  VcardFields,
  EmailFields,
  SmsFields,
} from './types';

/**
 * Formats structured input data into QR-encodable string per mode.
 * Handles escaping for WIFI, vCard, email, SMS modes.
 */
export function formatData(
  mode: InputMode,
  fields: string | WifiFields | VcardFields | EmailFields | SmsFields
): string {
  if (mode === 'text') {
    return fields as string;
  }
  if (mode === 'url') {
    return fields as string;
  }
  if (mode === 'wifi') {
    return formatWifi(fields as WifiFields);
  }
  if (mode === 'vcard') {
    return formatVcard(fields as VcardFields);
  }
  if (mode === 'email') {
    return formatEmail(fields as EmailFields);
  }
  if (mode === 'sms') {
    return formatSms(fields as SmsFields);
  }
  throw new Error(`Unknown mode: ${mode}`);
}

function formatWifi(fields: WifiFields): string {
  const ssid = escapeWifiField(fields.ssid);
  const pwd = escapeWifiField(fields.password);
  const type = fields.encryption === 'WEP' ? 'WEP' : 'WPA';
  return `WIFI:T:${type};S:${ssid};P:${pwd};;`;
}

function formatVcard(fields: VcardFields): string {
  let card = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
  card += `FN:${escapeVcardField(fields.name)}\r\n`;
  if (fields.phone) card += `TEL:${escapeVcardField(fields.phone)}\r\n`;
  if (fields.email) card += `EMAIL:${escapeVcardField(fields.email)}\r\n`;
  if (fields.url) card += `URL:${escapeVcardField(fields.url)}\r\n`;
  card += 'END:VCARD';
  return card;
}

function formatEmail(fields: EmailFields): string {
  const params = new URLSearchParams();
  if (fields.subject) params.append('subject', fields.subject);
  if (fields.body) params.append('body', fields.body);
  const qs = params.toString();
  return qs ? `mailto:${fields.email}?${qs}` : `mailto:${fields.email}`;
}

function formatSms(fields: SmsFields): string {
  return `smsto:${fields.phone}:${encodeURIComponent(fields.message || '')}`;
}

function escapeWifiField(s: string): string {
  return s.replace(/([;:,\\"])/g, '\\$1');
}

function escapeVcardField(s: string): string {
  return s.replace(/([;\n\r])/g, '\\$1');
}
