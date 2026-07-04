import { render, screen, fireEvent, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { EyedropperCursor } from '../EyedropperCursor';
import messagesKo from '@/i18n/messages/ko.json';

const messages = messagesKo as any;

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function makeMockCanvas() {
  const mockCanvas = document.createElement('canvas');
  mockCanvas.width = 200;
  mockCanvas.height = 150;
  mockCanvas.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 200,
    bottom: 150,
    width: 200,
    height: 150,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  const mockCtx = {
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray([255, 0, 0, 255]),
    })),
  };
  mockCanvas.getContext = vi.fn(() => mockCtx as any);
  return { mockCanvas, mockCtx };
}

describe('EyedropperCursor', () => {
  const mockCallbacks = {
    onColorSampled: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isActive is false', () => {
    const { container } = renderWithIntl(
      <EyedropperCursor
        isActive={false}
        imageCanvas={undefined}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders a visible mode banner and cancel button as soon as active, with no prior pointer interaction', () => {
    const { mockCanvas } = makeMockCanvas();

    renderWithIntl(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    // Touch users never fire `mousemove`; the banner + cancel affordance must
    // still be visible so they know the mode is on and can get out of it.
    expect(screen.getByRole('status')).toHaveTextContent(
      messages.tools['transparent-background'].colorPicker.eyedropperActive
    );
    expect(
      screen.getByRole('button', { name: messages.tools['transparent-background'].colorPicker.eyedropperCancel })
    ).toBeInTheDocument();
  });

  it('does not render the color-preview circle until a pointer hover occurs', () => {
    const { mockCanvas } = makeMockCanvas();

    renderWithIntl(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    // The preview circle is a mouse-hover-only cosmetic; it's fine for it to
    // be absent, as long as the banner/cancel button above are present.
    const overlay = document.querySelector('[style*="border-radius"], .rounded-full[style*="background-color"]');
    expect(overlay).toBeNull();
  });

  it('calls onCancel and does not sample a color when the cancel button is clicked', () => {
    const { mockCanvas } = makeMockCanvas();

    renderWithIntl(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: messages.tools['transparent-background'].colorPicker.eyedropperCancel })
    );

    expect(mockCallbacks.onCancel).toHaveBeenCalledTimes(1);
    expect(mockCallbacks.onColorSampled).not.toHaveBeenCalled();
  });

  it('calls onCancel when Escape key is pressed', () => {
    const { mockCanvas } = makeMockCanvas();

    renderWithIntl(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(mockCallbacks.onCancel).toHaveBeenCalled();
  });

  it('handles mouse movement on canvas (hover preview)', () => {
    const { mockCanvas, mockCtx } = makeMockCanvas();

    renderWithIntl(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 50, clientY: 50, bubbles: true })
      );
    });

    expect(mockCtx.getImageData).toHaveBeenCalled();
  });

  it('samples a color directly from a click/tap with no prior mousemove (touch tap)', () => {
    const { mockCanvas } = makeMockCanvas();

    renderWithIntl(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    // No mousemove fired first — this is what a touch tap looks like.
    act(() => {
      document.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 50, bubbles: true }));
    });

    expect(mockCallbacks.onColorSampled).toHaveBeenCalledWith({ r: 255, g: 0, b: 0 });
  });

  it('registers document event listeners when active and canvas is provided', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const { mockCanvas } = makeMockCanvas();

    renderWithIntl(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });
});
