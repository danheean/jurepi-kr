import { render, screen, fireEvent, waitFor } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { Base64Encoder } from './Base64Encoder';

describe('Base64Encoder orchestrator', () => {
  it('renders with mounting gate and interactive elements', () => {
    const { container } = render(<Base64Encoder locale="en" />);

    // Verify component renders (not just null from mounting gate)
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('encodes text input to Base64 on process button click', async () => {
    render(<Base64Encoder locale="en" />);

    const textareas = screen.getAllByRole('textbox');
    const inputTextarea = textareas[0] as HTMLTextAreaElement;

    fireEvent.change(inputTextarea, { target: { value: 'hello' } });

    const processButton = screen.getByRole('button', { name: 'Convert' });
    expect(processButton).not.toBeDisabled();

    fireEvent.click(processButton);

    await waitFor(() => {
      const outputTextarea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('aGVsbG8=');
    });
  });

  it('decodes valid Base64 to plaintext when direction is decode', async () => {
    render(<Base64Encoder locale="en" />);

    const radios = screen.getAllByRole('radio');
    const decodeRadio = radios.find((r) => (r as HTMLInputElement).value === 'decode');
    expect(decodeRadio).toBeDefined();
    fireEvent.click(decodeRadio!);

    const textareas = screen.getAllByRole('textbox');
    const inputTextarea = textareas[0] as HTMLTextAreaElement;

    fireEvent.change(inputTextarea, { target: { value: 'aGVsbG8gd29ybGQ=' } });

    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));

    await waitFor(() => {
      const outputTextarea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('hello world');
    });
  });

  it('blocks processing of invalid Base64 in decode direction (validation contract)', () => {
    render(<Base64Encoder locale="en" />);

    const radios = screen.getAllByRole('radio');
    const decodeRadio = radios.find((r) => (r as HTMLInputElement).value === 'decode');
    fireEvent.click(decodeRadio!);

    const textareas = screen.getAllByRole('textbox');
    const inputTextarea = textareas[0] as HTMLTextAreaElement;

    // Invalid charset for Base64 — isValidInput must be false, disabling the button
    fireEvent.change(inputTextarea, { target: { value: 'ABC!@#' } });

    expect(screen.getByRole('button', { name: 'Convert' })).toBeDisabled();

    // Same input in encode direction is processable (plain text)
    const encodeRadio = radios.find((r) => (r as HTMLInputElement).value === 'encode');
    fireEvent.click(encodeRadio!);
    expect(screen.getByRole('button', { name: 'Convert' })).not.toBeDisabled();
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

  it('process button is disabled with empty input', () => {
    render(<Base64Encoder locale="en" />);

    const processButton = screen.getByRole('button', { name: 'Convert' });
    expect(processButton).toBeDisabled();
  });
});
