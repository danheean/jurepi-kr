import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { HeroMascot } from './HeroMascot';

describe('HeroMascot', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the mascot image with a greeting', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_URL', '');
    render(<HeroMascot greeting="안녕하세요" />);

    expect(screen.getByRole('img', { name: 'Jurepi mascot' })).toBeInTheDocument();
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
  });

  it('is NOT a link when no blog URL is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_URL', '');
    render(<HeroMascot greeting="안녕하세요" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('keeps the mascot non-interactive when the blog URL is whitespace', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_URL', '   ');
    render(<HeroMascot greeting="안녕하세요" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('wraps the mascot in a link to the blog when configured', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_URL', 'https://blog.naver.com/dhan0213');
    render(<HeroMascot greeting="안녕하세요" />);

    const link = screen.getByRole('link', { name: 'Jurepi blog' });
    expect(link).toHaveAttribute('href', 'https://blog.naver.com/dhan0213');
    // The mascot image lives inside the link.
    expect(link).toContainElement(
      screen.getByRole('img', { name: 'Jurepi mascot' })
    );
  });
});
