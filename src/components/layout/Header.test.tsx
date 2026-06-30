import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Header } from './Header';

// Mock next-intl routing
vi.mock('@/i18n/routing', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
  }),
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => null,
}));

// Mock the scroll listener to avoid issues in test environment
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
window.addEventListener = mockAddEventListener;
window.removeEventListener = mockRemoveEventListener;

describe('Header', () => {
  it('renders the wordmark link', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const wordmark = screen.getByRole('link', { name: 'Jurepi' });
    expect(wordmark).toBeInTheDocument();
    expect(wordmark).toHaveAttribute('href', '/');
  });

  it('renders search trigger button', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const searchButton = screen.getByTestId('header-search');
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).toHaveAttribute('aria-label', 'Search tools');
  });

  it('renders locale switcher buttons', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const koBtn = screen.getByTestId('locale-ko');
    const enBtn = screen.getByTestId('locale-en');

    expect(koBtn).toBeInTheDocument();
    expect(enBtn).toBeInTheDocument();
    expect(koBtn).toHaveTextContent('KO');
    expect(enBtn).toHaveTextContent('EN');
  });

  it('renders theme toggle button', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const themeToggle = screen.getByTestId('theme-toggle');
    expect(themeToggle).toBeInTheDocument();
  });

  it('has semantic header and nav elements', () => {
    const { container } = render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const headerEl = container.querySelector('header');
    const navEl = container.querySelector('nav');

    expect(headerEl).toBeInTheDocument();
    expect(navEl).toBeInTheDocument();
    expect(navEl).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('has sticky positioning', () => {
    const { container } = render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const headerEl = container.querySelector('header');
    expect(headerEl).toHaveClass('sticky', 'top-0', 'z-40');
  });

  it('has correct height (h-16 = 64px)', () => {
    const { container } = render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const headerEl = container.querySelector('header');
    expect(headerEl).toHaveClass('h-16');
  });
});
