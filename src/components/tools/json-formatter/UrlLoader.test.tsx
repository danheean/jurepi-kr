import { render, screen, waitFor, userEvent } from '@/__test__/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UrlLoader } from './UrlLoader';

describe('UrlLoader', () => {
  const mockOnLoad = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders URL input and load button', () => {
    render(
      <UrlLoader
        isLoading={false}
        error={null}
        onLoad={mockOnLoad}
      />
    );

    expect(screen.getByPlaceholderText('https://api.example.com/data.json')).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
  });

  it('disables button when isLoading is true', () => {
    render(
      <UrlLoader
        isLoading={true}
        error={null}
        onLoad={mockOnLoad}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables input when isLoading is true', () => {
    render(
      <UrlLoader
        isLoading={true}
        error={null}
        onLoad={mockOnLoad}
      />
    );

    const input = screen.getByPlaceholderText('https://api.example.com/data.json') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('calls onLoad when button is clicked', async () => {
    render(
      <UrlLoader
        isLoading={false}
        error={null}
        onLoad={mockOnLoad}
      />
    );

    const input = screen.getByPlaceholderText('https://api.example.com/data.json') as HTMLInputElement;
    const button = screen.getByText('Load');

    await userEvent.type(input, 'https://api.example.com/data.json');
    await userEvent.click(button);

    expect(mockOnLoad).toHaveBeenCalledWith('https://api.example.com/data.json');
  });

  it('calls onLoad when Enter is pressed in input', async () => {

    render(
      <UrlLoader
        isLoading={false}
        error={null}
        onLoad={mockOnLoad}
      />
    );

    const input = screen.getByPlaceholderText('https://api.example.com/data.json') as HTMLInputElement;

    await userEvent.type(input, 'https://api.example.com/data.json{Enter}');

    expect(mockOnLoad).toHaveBeenCalledWith('https://api.example.com/data.json');
  });

  it('displays CORS error message when error.code is cors_or_network', () => {
    render(
      <UrlLoader
        isLoading={false}
        error={{
          code: 'cors_or_network',
          message: 'errors.urlLoad.cors_or_network',
        }}
        onLoad={mockOnLoad}
      />
    );

    expect(screen.getByText(/does not allow cross-origin access/)).toBeInTheDocument();
    expect(screen.getByText(/download the file and paste it instead/)).toBeInTheDocument();
  });

  it('displays invalid_url error message', () => {
    render(
      <UrlLoader
        isLoading={false}
        error={{
          code: 'invalid_url',
          message: 'errors.urlLoad.invalid_url',
        }}
        onLoad={mockOnLoad}
      />
    );

    expect(screen.getByText(/valid http/)).toBeInTheDocument();
  });

  it('displays http_error with status code', () => {
    render(
      <UrlLoader
        isLoading={false}
        error={{
          code: 'http_error',
          message: 'errors.urlLoad.http_error',
          httpStatus: 404,
        }}
        onLoad={mockOnLoad}
      />
    );

    expect(screen.getByText(/Server returned status 404/)).toBeInTheDocument();
  });

  it('displays too_large error message', () => {
    render(
      <UrlLoader
        isLoading={false}
        error={{
          code: 'too_large',
          message: 'errors.urlLoad.too_large',
        }}
        onLoad={mockOnLoad}
      />
    );

    expect(screen.getByText(/too large to process/)).toBeInTheDocument();
  });

  it('displays empty_body error message', () => {
    render(
      <UrlLoader
        isLoading={false}
        error={{
          code: 'empty_body',
          message: 'errors.urlLoad.empty_body',
        }}
        onLoad={mockOnLoad}
      />
    );

    expect(screen.getByText(/Response body is empty/)).toBeInTheDocument();
  });

  it('clears error when input is changed', async () => {
    const mockOnClearError = vi.fn();

    render(
      <UrlLoader
        isLoading={false}
        error={{
          code: 'invalid_url',
          message: 'errors.urlLoad.invalid_url',
        }}
        onLoad={mockOnLoad}
        onClearError={mockOnClearError}
      />
    );

    const input = screen.getByPlaceholderText('https://api.example.com/data.json') as HTMLInputElement;
    await userEvent.type(input, 'x');

    expect(mockOnClearError).toHaveBeenCalled();
  });

  it('shows loading spinner when isLoading is true', () => {
    const { container } = render(
      <UrlLoader
        isLoading={true}
        error={null}
        onLoad={mockOnLoad}
      />
    );

    // SVG spinner should be rendered
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('disables button when URL is empty', () => {
    render(
      <UrlLoader
        isLoading={false}
        error={null}
        onLoad={mockOnLoad}
      />
    );

    const button = screen.getByText('Load');
    expect(button).toBeDisabled();
  });
});
