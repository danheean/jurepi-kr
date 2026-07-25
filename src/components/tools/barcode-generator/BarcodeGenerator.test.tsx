import { act } from '@testing-library/react';
import { render, screen, userEvent, waitFor } from '@/__test__/test-utils';
import { BarcodeGenerator } from './BarcodeGenerator';

// Real jsbarcode classes (bin/ CJS) — no DOM, safe in jsdom. Mirrors the
// domain layer's own integration tests rather than hand-rolling a fake encoder.
vi.mock('@/lib/barcode-generator', async () => {
  const actual = await vi.importActual('@/lib/barcode-generator');
  return actual;
});

describe('BarcodeGenerator (integration)', () => {
  it('renders only the interactive generator (Intro/StructuredData/HowTo/Faq are route-level only)', () => {
    render(<BarcodeGenerator />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByLabelText('Value to encode')).toBeInTheDocument();
    // The shared <ToolIntro> (H1/eyebrow/lead) and StructuredData/HowTo/Faq are
    // rendered once by the route ([slug]/page.tsx ToolContent/ToolBody), not by
    // BarcodeGenerator itself — asserting their absence here guards against the
    // duplicate-H1/duplicate-JSON-LD regressions this tool previously had.
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText('Frequently Asked Questions')).not.toBeInTheDocument();
    expect(screen.queryByText('How to Generate a Barcode')).not.toBeInTheDocument();
  });

  it('encodes a valid EAN-13 end to end and enables downloads', async () => {
    const user = userEvent.setup();
    render(<BarcodeGenerator />);
    // Flush the mount-time async encoder-class load before typing, so the
    // first debounced encode isn't racing against loadBarcodeEncoder().
    await act(async () => {});

    await user.type(screen.getByLabelText('Value to encode'), '978014300723');

    await waitFor(() => expect(screen.getByTestId('download-png-button')).toBeEnabled(), {
      timeout: 2000,
    });
    expect(screen.getByTestId('barcode-canvas')).toBeInTheDocument();
  });

  // Format-switching and checksum-error behavior are covered deterministically
  // (fake timers, no real-clock races) in useBarcodeGenerator.test.ts. Chaining
  // more real-timer scenarios onto rendered trees in this same file proved
  // order-dependent/flaky in practice (a prior test's in-flight 100ms debounce
  // can still be settling when the next test's render starts, even with a
  // generous waitFor timeout) — passed reliably in isolation, failed together.
  // Keep this file to smoke-testing the wiring itself, not every branch.
});
