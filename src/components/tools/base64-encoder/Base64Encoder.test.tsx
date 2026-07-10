import { render, screen, fireEvent, waitFor } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { Base64Encoder } from './Base64Encoder';

describe('Base64Encoder orchestrator', () => {
  it('renders with mounting gate and interactive elements', () => {
    const { container } = render(<Base64Encoder locale="en" />);

    // Verify component renders (not just null from mounting gate)
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('encodes text input to Base64 live as the user types', async () => {
    render(<Base64Encoder locale="en" />);

    const inputTextarea = screen.getAllByRole('textbox')[0] as HTMLTextAreaElement;

    fireEvent.change(inputTextarea, { target: { value: 'hello' } });

    await waitFor(() => {
      const outputTextarea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('aGVsbG8=');
    });
  });

  it('decodes valid Base64 to plaintext live when direction is decode', async () => {
    render(<Base64Encoder locale="en" />);

    const radios = screen.getAllByRole('radio');
    const decodeRadio = radios.find((r) => (r as HTMLInputElement).value === 'decode');
    expect(decodeRadio).toBeDefined();
    fireEvent.click(decodeRadio!);

    const inputTextarea = screen.getAllByRole('textbox')[0] as HTMLTextAreaElement;

    fireEvent.change(inputTextarea, { target: { value: 'aGVsbG8gd29ybGQ=' } });

    await waitFor(() => {
      const outputTextarea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('hello world');
    });
  });

  it('emits no output for invalid Base64 in decode, converts once valid (validation contract)', async () => {
    render(<Base64Encoder locale="en" />);

    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios.find((r) => (r as HTMLInputElement).value === 'decode')!);

    const inputTextarea = screen.getAllByRole('textbox')[0] as HTMLTextAreaElement;

    // Invalid Base64 in decode → live output stays empty (no garbage, no crash)
    fireEvent.change(inputTextarea, { target: { value: 'ABC!@#' } });
    await waitFor(() => {
      expect((screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value).toBe('');
    });

    // Same input in encode direction is valid plaintext → converts live
    fireEvent.click(radios.find((r) => (r as HTMLInputElement).value === 'encode')!);
    await waitFor(() => {
      expect(
        (screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value.length
      ).toBeGreaterThan(0);
    });
  });

  it('does not leak Korean text to English locale rendering', () => {
    const { container } = render(<Base64Encoder locale="en" />);

    const textareas = screen.getAllByRole('textbox');
    textareas.forEach((ta) => {
      const placeholder = (ta as HTMLTextAreaElement).placeholder;
      expect(placeholder).not.toMatch(/[가-힣]/);
    });

    const mainContent = container.querySelector('.space-y-8');
    expect(mainContent).not.toBeNull();
    const visibleKorean = mainContent!.textContent?.match(/[가-힣]/);
    expect(visibleKorean).toBeNull();
  });

  it('renders radio buttons for mode/variant/direction selection', () => {
    render(<Base64Encoder locale="en" />);

    const radios = screen.getAllByRole('radio');
    // At minimum: 2 modes + 2 variants + 2 directions = 6
    expect(radios.length).toBeGreaterThanOrEqual(6);
  });

  it('renders input/output textareas', () => {
    render(<Base64Encoder locale="en" />);

    const textareas = screen.getAllByRole('textbox');
    // Input + output = 2 minimum
    expect(textareas.length).toBeGreaterThanOrEqual(2);
  });

  it('renders no manual Convert button and shows no output for empty input', () => {
    render(<Base64Encoder locale="en" />);

    // Conversion is live — the manual Convert button must be gone
    expect(screen.queryByRole('button', { name: 'Convert' })).toBeNull();

    const outputTextarea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
    expect(outputTextarea.value).toBe('');
  });
});
