import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { LocaleSwitcher } from './LocaleSwitcher';

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

describe('LocaleSwitcher', () => {
  it('renders KO and EN buttons', () => {
    render(<LocaleSwitcher />);

    const koBtn = screen.getByTestId('locale-ko');
    const enBtn = screen.getByTestId('locale-en');

    expect(koBtn).toBeInTheDocument();
    expect(enBtn).toBeInTheDocument();
  });

  it('displays correct locale labels', () => {
    render(<LocaleSwitcher />);

    expect(screen.getByText('KO')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    render(<LocaleSwitcher />);

    const koBtn = screen.getByTestId('locale-ko');
    const enBtn = screen.getByTestId('locale-en');

    expect(koBtn).toHaveAttribute('aria-label');
    expect(enBtn).toHaveAttribute('aria-label');
  });

  it('buttons are keyboard accessible', () => {
    render(<LocaleSwitcher />);

    const koBtn = screen.getByTestId('locale-ko') as HTMLButtonElement;
    const enBtn = screen.getByTestId('locale-en') as HTMLButtonElement;

    expect(koBtn).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-brand');
    expect(enBtn).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-brand');
  });

  it('renders separator divider', () => {
    const { container } = render(<LocaleSwitcher />);
    const separator = container.querySelector('.text-hairline');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveTextContent('|');
  });
});
