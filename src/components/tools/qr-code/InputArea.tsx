'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { InputMode, WifiFields, VcardFields, EmailFields, SmsFields } from '@/lib/qr-code/types';
import { formatData } from '@/lib/qr-code';
import { MAX_INPUT_LENGTH } from '@/lib/qr-code/schema';

interface InputAreaProps {
  mode: InputMode;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

interface LocalFieldState {
  wifi: WifiFields;
  vcard: VcardFields;
  email: EmailFields;
  sms: SmsFields;
}

export function InputArea({
  mode,
  value,
  onChange,
  maxLength = MAX_INPUT_LENGTH,
}: InputAreaProps) {
  const t = useTranslations('tools.qr-code');

  // Local state for structured fields
  const [fieldState, setFieldState] = useState<LocalFieldState>({
    wifi: { ssid: '', password: '', encryption: 'WPA' },
    vcard: { name: '', phone: '', email: '', url: '' },
    email: { email: '', subject: '', body: '' },
    sms: { phone: '', message: '' },
  });

  // Initialize field state from emitted string when mode changes
  useEffect(() => {
    // For text/url modes, nothing to initialize (value is the raw string)
    // For structured modes, try to parse the emitted string back to fields
    // This is a best-effort recovery; typically users won't see this
    if (mode === 'wifi' || mode === 'vcard' || mode === 'email' || mode === 'sms') {
      // Reset to empty on mode change (user starts fresh)
      const newState = { ...fieldState };
      if (mode === 'wifi') {
        newState.wifi = { ssid: '', password: '', encryption: 'WPA' };
      } else if (mode === 'vcard') {
        newState.vcard = { name: '', phone: '', email: '', url: '' };
      } else if (mode === 'email') {
        newState.email = { email: '', subject: '', body: '' };
      } else if (mode === 'sms') {
        newState.sms = { phone: '', message: '' };
      }
      setFieldState(newState);
      // Also clear the emitted value when switching modes
      onChange('');
    }
  }, [mode]);

  const handleRawTextChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleWifiChange = (updates: Partial<WifiFields>) => {
    const newFields = { ...fieldState.wifi, ...updates };
    setFieldState({ ...fieldState, wifi: newFields });
    const formatted = formatData('wifi', newFields);
    onChange(formatted);
  };

  const handleVcardChange = (updates: Partial<VcardFields>) => {
    const newFields = { ...fieldState.vcard, ...updates };
    setFieldState({ ...fieldState, vcard: newFields });
    const formatted = formatData('vcard', newFields);
    onChange(formatted);
  };

  const handleEmailChange = (updates: Partial<EmailFields>) => {
    const newFields = { ...fieldState.email, ...updates };
    setFieldState({ ...fieldState, email: newFields });
    const formatted = formatData('email', newFields);
    onChange(formatted);
  };

  const handleSmsChange = (updates: Partial<SmsFields>) => {
    const newFields = { ...fieldState.sms, ...updates };
    setFieldState({ ...fieldState, sms: newFields });
    const formatted = formatData('sms', newFields);
    onChange(formatted);
  };

  const currentLength = value.length;
  const isTooLong = currentLength >= maxLength;
  const isNearLimit = currentLength >= maxLength * 0.8;

  const placeholder = t(`inputArea.placeholder.${mode}`);

  if (mode === 'text' || mode === 'url') {
    return (
      <div className="space-y-2">
        <textarea
          value={value}
          onChange={(e) => handleRawTextChange(e.target.value)}
          placeholder={placeholder}
          aria-label={t('inputArea.label')}          maxLength={maxLength}
          rows={5}
          className={`w-full px-3 py-2 rounded-md border bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50 resize-none ${
            isTooLong ? 'border-accent-coral' : isNearLimit ? 'border-accent-sun' : 'border-hairline'
          }`}
        />
        <div
          className={`text-xs flex justify-between ${
            isTooLong
              ? 'text-danger-ink'
              : isNearLimit
                ? 'text-warning-ink'
                : 'text-text-secondary'
          }`}
        >
          <span>
            {t('inputArea.charCount', { current: currentLength, max: maxLength })}
          </span>
          {isTooLong && (
            <span>{t('inputArea.tooLong', { max: maxLength })}</span>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'wifi') {
    return (
      <div className="space-y-3">
        <div>
          <label htmlFor="qr-wifi-ssid" className="block text-sm font-medium text-text mb-1">
            {t('wifi.ssidLabel')}
          </label>
          <input
            id="qr-wifi-ssid"
            type="text"
            value={fieldState.wifi.ssid}
            onChange={(e) => handleWifiChange({ ssid: e.target.value })}
            placeholder={t('wifi.ssidPh')}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="qr-wifi-password" className="block text-sm font-medium text-text mb-1">
            {t('wifi.passwordLabel')}
          </label>
          <input
            id="qr-wifi-password"
            type="password"
            value={fieldState.wifi.password}
            onChange={(e) => handleWifiChange({ password: e.target.value })}
            placeholder={t('wifi.passwordPh')}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="qr-wifi-encryption" className="block text-sm font-medium text-text mb-1">
            {t('wifi.encryptionLabel')}
          </label>
          <select
            id="qr-wifi-encryption"
            value={fieldState.wifi.encryption}
            onChange={(e) => handleWifiChange({ encryption: e.target.value as 'WEP' | 'WPA' | 'nopass' })}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          >
            <option value="WPA">{t('wifi.wpa')}</option>
            <option value="WEP">{t('wifi.wep')}</option>
            <option value="nopass">{t('wifi.nopass')}</option>
          </select>
        </div>

        <div className="text-xs text-text-secondary">
          {t('inputArea.charCount', { current: value.length, max: maxLength })}
        </div>
      </div>
    );
  }

  if (mode === 'vcard') {
    return (
      <div className="space-y-3">
        <div>
          <label htmlFor="qr-vcard-name" className="block text-sm font-medium text-text mb-1">
            {t('vcard.nameLabel')}
          </label>
          <input
            id="qr-vcard-name"
            type="text"
            value={fieldState.vcard.name}
            onChange={(e) => handleVcardChange({ name: e.target.value })}
            placeholder={t('vcard.namePh')}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="qr-vcard-phone" className="block text-sm font-medium text-text mb-1">
            {t('vcard.phoneLabel')}
          </label>
          <input
            id="qr-vcard-phone"
            type="tel"
            value={fieldState.vcard.phone || ''}
            onChange={(e) => handleVcardChange({ phone: e.target.value })}
            placeholder={t('vcard.phonePh')}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="qr-vcard-email" className="block text-sm font-medium text-text mb-1">
            {t('vcard.emailLabel')}
          </label>
          <input
            id="qr-vcard-email"
            type="email"
            value={fieldState.vcard.email || ''}
            onChange={(e) => handleVcardChange({ email: e.target.value })}
            placeholder={t('vcard.emailPh')}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="qr-vcard-url" className="block text-sm font-medium text-text mb-1">
            {t('vcard.urlLabel')}
          </label>
          <input
            id="qr-vcard-url"
            type="url"
            value={fieldState.vcard.url || ''}
            onChange={(e) => handleVcardChange({ url: e.target.value })}
            placeholder={t('vcard.urlPh')}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        <div className="text-xs text-text-secondary">
          {t('inputArea.charCount', { current: value.length, max: maxLength })}
        </div>
      </div>
    );
  }

  if (mode === 'email') {
    return (
      <div className="space-y-3">
        <div>
          <label htmlFor="qr-email-email" className="block text-sm font-medium text-text mb-1">
            {t('email.emailLabel')}
          </label>
          <input
            id="qr-email-email"
            type="email"
            value={fieldState.email.email}
            onChange={(e) => handleEmailChange({ email: e.target.value })}
            placeholder={t('email.emailPh')}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="qr-email-subject" className="block text-sm font-medium text-text mb-1">
            {t('email.subjectLabel')}
          </label>
          <input
            id="qr-email-subject"
            type="text"
            value={fieldState.email.subject || ''}
            onChange={(e) => handleEmailChange({ subject: e.target.value })}
            placeholder={t('email.subjectPh')}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="qr-email-body" className="block text-sm font-medium text-text mb-1">
            {t('email.bodyLabel')}
          </label>
          <textarea
            id="qr-email-body"
            value={fieldState.email.body || ''}
            onChange={(e) => handleEmailChange({ body: e.target.value })}
            placeholder={t('email.bodyPh')}            rows={3}
            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50 resize-none"
          />
        </div>

        <div className="text-xs text-text-secondary">
          {t('inputArea.charCount', { current: value.length, max: maxLength })}
        </div>
      </div>
    );
  }

  if (mode === 'sms') {
    return (
      <div className="space-y-3">
        <div>
          <label htmlFor="qr-sms-phone" className="block text-sm font-medium text-text mb-1">
            {t('sms.phoneLabel')}
          </label>
          <input
            id="qr-sms-phone"
            type="tel"
            value={fieldState.sms.phone}
            onChange={(e) => handleSmsChange({ phone: e.target.value })}
            placeholder={t('sms.phonePh')}            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="qr-sms-message" className="block text-sm font-medium text-text mb-1">
            {t('sms.messageLabel')}
          </label>
          <textarea
            id="qr-sms-message"
            value={fieldState.sms.message || ''}
            onChange={(e) => handleSmsChange({ message: e.target.value })}
            placeholder={t('sms.messagePh')}            rows={3}
            className="w-full px-3 py-2 rounded-md border border-hairline bg-surface text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none disabled:opacity-50 resize-none"
          />
        </div>

        <div className="text-xs text-text-secondary">
          {t('inputArea.charCount', { current: value.length, max: maxLength })}
        </div>
      </div>
    );
  }

  return null;
}
