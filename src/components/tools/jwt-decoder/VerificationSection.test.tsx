import { render, screen, userEvent } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { VerificationSection } from './VerificationSection';

describe('VerificationSection', () => {
  const defaultProps = {
    mode: 'off' as const,
    secret: '',
    publicKey: '',
    onModeChange: vi.fn(),
    onSecretChange: vi.fn(),
    onKeyChange: vi.fn(),
    onVerify: vi.fn(),
    isVerifying: false,
  };

  it('renders with collapsible details element', () => {
    const { container } = render(
      <VerificationSection {...defaultProps} />
    );

    const details = container.querySelector('details');
    expect(details).toBeInTheDocument();
  });

  it('renders verification title', () => {
    render(<VerificationSection {...defaultProps} />);

    expect(screen.getByText('Signature Verification (Advanced)')).toBeInTheDocument();
  });

  it('renders mode radio buttons', () => {
    render(<VerificationSection {...defaultProps} />);

    const offRadio = screen.getByRole('radio', { name: /Off/ });
    const hmacRadio = screen.getByRole('radio', { name: /HMAC/ });
    const rsaRadio = screen.getByRole('radio', { name: /RSA/ });

    expect(offRadio).toBeInTheDocument();
    expect(hmacRadio).toBeInTheDocument();
    expect(rsaRadio).toBeInTheDocument();
  });

  it('sets initial mode selection', () => {
    const { rerender } = render(
      <VerificationSection {...defaultProps} mode="off" />
    );

    const offRadio = screen.getByRole('radio', { name: /Off/ }) as HTMLInputElement;
    expect(offRadio.checked).toBe(true);

    rerender(
      <VerificationSection {...defaultProps} mode="hmac" />
    );

    const hmacRadio = screen.getByRole('radio', { name: /HMAC/ }) as HTMLInputElement;
    expect(hmacRadio.checked).toBe(true);
  });

  it('calls onModeChange when mode radio is clicked', async () => {
    const onModeChange = vi.fn();

    render(
      <VerificationSection {...defaultProps} onModeChange={onModeChange} />
    );

    const hmacRadio = screen.getByRole('radio', { name: /HMAC/ });
    await userEvent.click(hmacRadio);

    expect(onModeChange).toHaveBeenCalledWith('hmac');
  });

  it('shows secret input when mode is hmac', async () => {
    render(
      <VerificationSection {...defaultProps} mode="hmac" />
    );

    const secretInput = screen.getByPlaceholderText(/e.g., my-secret-key/i);
    expect(secretInput).toBeInTheDocument();
  });

  it('calls onSecretChange when secret input changes', async () => {
    const onSecretChange = vi.fn();

    render(
      <VerificationSection {...defaultProps} mode="hmac" onSecretChange={onSecretChange} />
    );

    const secretInput = screen.getByPlaceholderText(/e.g., my-secret-key/i) as HTMLTextAreaElement;
    await userEvent.type(secretInput, 'test-secret');

    expect(onSecretChange).toHaveBeenCalled();
  });

  it('shows public key input when mode is rsa', () => {
    render(
      <VerificationSection {...defaultProps} mode="rsa" />
    );

    const keyInput = screen.getByPlaceholderText(/BEGIN PUBLIC KEY/);
    expect(keyInput).toBeInTheDocument();
  });

  it('calls onKeyChange when public key input changes', async () => {
    const onKeyChange = vi.fn();

    render(
      <VerificationSection {...defaultProps} mode="rsa" onKeyChange={onKeyChange} />
    );

    const keyInput = screen.getByPlaceholderText(/BEGIN PUBLIC KEY/);
    await userEvent.type(keyInput, 'key-data');

    expect(onKeyChange).toHaveBeenCalled();
  });

  it('does not show secret/key input when mode is off', () => {
    render(
      <VerificationSection {...defaultProps} mode="off" />
    );

    expect(screen.queryByPlaceholderText(/e.g., my-secret-key/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/BEGIN PUBLIC KEY/)).not.toBeInTheDocument();
  });

  it('shows verify button when mode is not off', () => {
    render(
      <VerificationSection {...defaultProps} mode="hmac" />
    );

    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    expect(verifyButton).toBeInTheDocument();
  });

  it('calls onVerify when verify button is clicked', async () => {
    const onVerify = vi.fn();

    render(
      <VerificationSection {...defaultProps} mode="hmac" onVerify={onVerify} />
    );

    const verifyButton = screen.getByRole('button', { name: /Verify/ });
    await userEvent.click(verifyButton);

    expect(onVerify).toHaveBeenCalled();
  });

  it('disables verify button when isVerifying is true', () => {
    render(
      <VerificationSection {...defaultProps} mode="hmac" isVerifying={true} />
    );

    const verifyButton = screen.getByRole('button', { name: /Verifying/ });
    expect(verifyButton).toBeDisabled();
  });

  it('shows verified badge when result.verified is true', () => {
    render(
      <VerificationSection
        {...defaultProps}
        mode="hmac"
        result={{ verified: true }}
      />
    );

    expect(screen.getByText('✓ Verified')).toBeInTheDocument();
  });

  it('shows failed badge when verification fails', () => {
    render(
      <VerificationSection
        {...defaultProps}
        mode="hmac"
        result={{ verified: false, error: 'Invalid signature' }}
      />
    );

    expect(screen.getByText('✗ Verification Failed')).toBeInTheDocument();
  });

  it('shows a localized failure badge (not the raw domain error) when verification fails', () => {
    render(
      <VerificationSection
        {...defaultProps}
        mode="hmac"
        result={{ verified: false, error: 'Invalid signature' }}
      />
    );

    // Localized badge is shown...
    expect(screen.getByText('✗ Verification Failed')).toBeInTheDocument();
    // ...and the raw English domain error is NOT leaked to the UI (would surface on /ko).
    expect(screen.queryByText('Invalid signature')).not.toBeInTheDocument();
  });

  it('shows unsupported algorithm badge', () => {
    render(
      <VerificationSection
        {...defaultProps}
        mode="hmac"
        result={{ verified: false, error: 'Unsupported algorithm' }}
      />
    );

    expect(screen.getByText('⊘ Unsupported Algorithm')).toBeInTheDocument();
  });

  it('hides verify button when mode is off', () => {
    render(
      <VerificationSection {...defaultProps} mode="off" />
    );

    expect(screen.queryByRole('button', { name: /Verify/ })).not.toBeInTheDocument();
  });

  it('renders mode radios with proper labels', () => {
    render(
      <VerificationSection {...defaultProps} />
    );

    expect(screen.getByLabelText(/Off/)).toBeInTheDocument();
    expect(screen.getByLabelText(/HMAC/)).toBeInTheDocument();
    expect(screen.getByLabelText(/RSA/)).toBeInTheDocument();
  });

  it('uses focus-visible styling on inputs', () => {
    const { container } = render(
      <VerificationSection {...defaultProps} mode="hmac" />
    );

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('focus-visible:ring-2');
  });

  it('maintains secret and key state from props', () => {
    render(
      <VerificationSection
        {...defaultProps}
        mode="hmac"
        secret="my-secret"
      />
    );

    const secretInput = screen.getByPlaceholderText(/e.g., my-secret-key/i) as HTMLTextAreaElement;
    expect(secretInput.value).toBe('my-secret');
  });

  it('displays verification result when present', () => {
    render(
      <VerificationSection
        {...defaultProps}
        mode="hmac"
        result={{ verified: true }}
      />
    );

    expect(screen.getByText('✓ Verified')).toBeInTheDocument();
  });
});
