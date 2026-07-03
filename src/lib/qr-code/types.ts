export type InputMode = 'text' | 'url' | 'wifi' | 'vcard' | 'email' | 'sms';

export type ECCLevel = 'L' | 'M' | 'Q' | 'H';

export interface QROptions {
  eccLevel: ECCLevel;
  size: number;
  quietZone: number;
  fgColor: string;
  bgColor: string;
  logoUrl?: string;
}

export interface QRInput {
  data: string;
  mode: InputMode;
}

export interface WifiFields {
  ssid: string;
  password: string;
  encryption: 'WEP' | 'WPA' | 'nopass';
}

export interface VcardFields {
  name: string;
  phone?: string;
  email?: string;
  url?: string;
}

export interface EmailFields {
  email: string;
  subject?: string;
  body?: string;
}

export interface SmsFields {
  phone: string;
  message?: string;
}

export interface QRGenerationResult {
  matrix: boolean[][];
  svg: string;
  contrastAcceptable: boolean;
}
