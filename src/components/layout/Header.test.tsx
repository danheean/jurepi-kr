import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import type { SearchableTool } from '@/lib/tool-search';
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
  const mockTools: SearchableTool[] = [
    {
      id: 'ladder',
      slug: 'ladder',
      name: 'Ladder Game',
      description: 'Fair way to decide',
      category: 'random',
      accent: 'coral',
      icon: 'ListTree',
      status: 'live',
      order: 1,
      keywords: ['ladder'],
    },
  ];

  it('renders the wordmark link', () => {
    render(
      <ThemeProvider>
        <Header tools={mockTools} />
      </ThemeProvider>
    );

    const wordmark = screen.getByRole('link', { name: 'Jurepi' });
    expect(wordmark).toBeInTheDocument();
    expect(wordmark).toHaveAttribute('href', '/');
  });

  it('renders search trigger button', () => {
    render(
      <ThemeProvider>
        <Header tools={mockTools} />
      </ThemeProvider>
    );

    const searchButton = screen.getByTestId('header-search');
    expect(searchButton).toBeInTheDocument();
  });

  it('renders locale switcher buttons', () => {
    render(
      <ThemeProvider>
        <Header tools={mockTools} />
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
        <Header tools={mockTools} />
      </ThemeProvider>
    );

    const themeToggle = screen.getByTestId('theme-toggle');
    expect(themeToggle).toBeInTheDocument();
  });

  it('has semantic header and nav elements', () => {
    const { container } = render(
      <ThemeProvider>
        <Header tools={mockTools} />
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
        <Header tools={mockTools} />
      </ThemeProvider>
    );

    const headerEl = container.querySelector('header');
    expect(headerEl).toHaveClass('sticky', 'top-0', 'z-40');
  });

  it('has correct height (h-16 = 64px)', () => {
    const { container } = render(
      <ThemeProvider>
        <Header tools={mockTools} />
      </ThemeProvider>
    );

    const headerEl = container.querySelector('header');
    expect(headerEl).toHaveClass('h-16');
  });
});
