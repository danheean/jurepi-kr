import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { InputArea } from '../InputArea';

const messages = {
  tools: {
    'qr-code': {
      inputArea: {
        placeholder: {
          text: 'Enter text.',
          url: 'Enter URL (e.g., https://jurepi.kr)',
          wifi: 'Enter Wi-Fi details.',
          vcard: 'Enter contact information.',
          email: 'Enter email address.',
          sms: 'Enter phone number and message.',
        },
        charCount: '{current} / {max}',
        tooLong: 'Max {max} characters.',
      },
      wifi: {
        ssidLabel: 'Network Name (SSID)',
        passwordLabel: 'Password',
        encryptionLabel: 'Security Type',
        wep: 'WEP',
        wpa: 'WPA',
        nopass: 'No Security',
      },
      vcard: {
        nameLabel: 'Name *',
        phoneLabel: 'Phone Number',
        emailLabel: 'Email',
        urlLabel: 'Website',
      },
      email: {
        emailLabel: 'Email Address *',
        subjectLabel: 'Subject',
        bodyLabel: 'Body',
      },
      sms: {
        phoneLabel: 'Phone Number *',
        messageLabel: 'Message',
      },
    },
  },
};

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('InputArea', () => {
  describe('Text and URL modes', () => {
    it('renders textarea for text mode', () => {
      const onChange = vi.fn();
      renderWithProvider(
        <InputArea
          mode="text"
          value="Hello"
          onChange={onChange}
          maxLength={100}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('Hello');
    });

    it('displays char count', () => {
      const onChange = vi.fn();
      renderWithProvider(
        <InputArea
          mode="text"
          value="Hello"
          onChange={onChange}
          maxLength={100}
        />
      );

      expect(screen.getByText('5 / 100')).toBeInTheDocument();
    });

    it('calls onChange when user types in textarea', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderWithProvider(
        <InputArea
          mode="text"
          value=""
          onChange={onChange}
          maxLength={100}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(textarea, 'test');

      // onChange should be called when user types
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Wi-Fi mode (formatData wiring)', () => {
    it('renders Wi-Fi structured fields', () => {
      const onChange = vi.fn();
      renderWithProvider(
        <InputArea
          mode="wifi"
          value=""
          onChange={onChange}
          maxLength={200}
        />
      );

      expect(screen.getByLabelText('Network Name (SSID)')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Security Type')).toBeInTheDocument();
    });

    it('emits WIFI: formatted string when SSID is entered', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderWithProvider(
        <InputArea
          mode="wifi"
          value=""
          onChange={onChange}
          maxLength={200}
        />
      );

      const ssidInput = screen.getByLabelText('Network Name (SSID)');
      await user.type(ssidInput, 'MyNetwork');

      // Should emit WIFI:T:WPA;S:MyNetwork;P:;;
      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toMatch(/^WIFI:T:WPA/);
      expect(lastCall).toContain('S:MyNetwork');
    });

    it('emits WIFI: string with password included', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderWithProvider(
        <InputArea
          mode="wifi"
          value=""
          onChange={onChange}
          maxLength={200}
        />
      );

      const ssidInput = screen.getByLabelText('Network Name (SSID)');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(ssidInput, 'TestNet');
      await user.type(passwordInput, 'secret123');

      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toContain('S:TestNet');
      expect(lastCall).toContain('P:secret123');
      expect(lastCall).toMatch(/^WIFI:T:WPA/);
    });
  });

  describe('vCard mode (formatData wiring)', () => {
    it('renders vCard structured fields', () => {
      const onChange = vi.fn();
      renderWithProvider(
        <InputArea
          mode="vcard"
          value=""
          onChange={onChange}
          maxLength={200}
        />
      );

      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    });

    it('emits vCard formatted string', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderWithProvider(
        <InputArea
          mode="vcard"
          value=""
          onChange={onChange}
          maxLength={500}
        />
      );

      const nameInput = screen.getByLabelText('Name *');
      await user.type(nameInput, 'John Doe');

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toContain('BEGIN:VCARD');
      expect(lastCall).toContain('FN:John Doe');
      expect(lastCall).toContain('END:VCARD');
    });
  });

  describe('Email mode (formatData wiring)', () => {
    it('renders email structured fields', () => {
      const onChange = vi.fn();
      renderWithProvider(
        <InputArea
          mode="email"
          value=""
          onChange={onChange}
          maxLength={200}
        />
      );

      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    });

    it('emits mailto: formatted string', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderWithProvider(
        <InputArea
          mode="email"
          value=""
          onChange={onChange}
          maxLength={300}
        />
      );

      const emailInput = screen.getByLabelText('Email Address *');
      const subjectInput = screen.getByLabelText('Subject');

      await user.type(emailInput, 'test@example.com');
      await user.type(subjectInput, 'Hello');

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toContain('mailto:test@example.com');
      expect(lastCall).toContain('subject=Hello');
    });
  });

  describe('SMS mode (formatData wiring)', () => {
    it('renders SMS structured fields', () => {
      const onChange = vi.fn();
      renderWithProvider(
        <InputArea
          mode="sms"
          value=""
          onChange={onChange}
          maxLength={200}
        />
      );

      expect(screen.getByLabelText('Phone Number *')).toBeInTheDocument();
      expect(screen.getByLabelText('Message')).toBeInTheDocument();
    });

    it('emits smsto: formatted string', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderWithProvider(
        <InputArea
          mode="sms"
          value=""
          onChange={onChange}
          maxLength={200}
        />
      );

      const phoneInput = screen.getByLabelText('Phone Number *');
      const messageInput = screen.getByLabelText('Message');

      await user.type(phoneInput, '1234567890');
      await user.type(messageInput, 'Hello');

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toContain('smsto:1234567890');
      expect(lastCall).toContain('Hello');
    });
  });
});
