import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/__test__/test-utils';
import { LinkRow } from './LinkRow';

describe('LinkRow', () => {
  describe('Plain link (no YouTube ID, no image)', () => {
    it('renders a link with label and description', () => {
      render(
        <LinkRow
          label="React Docs"
          url="https://react.dev"
          description="Official React documentation"
          locale="en"
        />
      );

      expect(screen.getByText('React Docs')).toBeInTheDocument();
      expect(screen.getByText('Official React documentation')).toBeInTheDocument();
    });

    it('opens link in new tab', () => {
      render(
        <LinkRow
          label="React Docs"
          url="https://react.dev"
          description="Official React documentation"
          locale="en"
        />
      );

      const link = screen.getByRole('link', { name: /React Docs/ });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders external link icon', () => {
      const { container } = render(
        <LinkRow
          label="React Docs"
          url="https://react.dev"
          description="Official React documentation"
          locale="en"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders without description if not provided', () => {
      render(
        <LinkRow
          label="React Docs"
          url="https://react.dev"
          locale="en"
        />
      );

      expect(screen.getByText('React Docs')).toBeInTheDocument();
      expect(screen.queryByText('Official React documentation')).not.toBeInTheDocument();
    });
  });

  describe('YouTube link with youtubeId', () => {
    it('renders YouTubeEmbed component', () => {
      render(
        <LinkRow
          label="React Tutorial"
          url="https://youtube.com/watch?v=dQw4w9WgXcQ"
          youtubeId="dQw4w9WgXcQ"
          description="Learn React basics"
          locale="en"
        />
      );

      expect(screen.getByText('React Tutorial')).toBeInTheDocument();
      expect(screen.getByText('Learn React basics')).toBeInTheDocument();
      expect(screen.getByLabelText('Play video')).toBeInTheDocument();
    });

    it('shows play button initially', () => {
      render(
        <LinkRow
          label="React Tutorial"
          url="https://youtube.com/watch?v=dQw4w9WgXcQ"
          youtubeId="dQw4w9WgXcQ"
          description="Learn React basics"
          locale="en"
        />
      );

      const playButton = screen.getByLabelText('Play video');
      expect(playButton).toBeInTheDocument();
    });

    it('renders external link affordance', () => {
      render(
        <LinkRow
          label="React Tutorial"
          url="https://youtube.com/watch?v=dQw4w9WgXcQ"
          youtubeId="dQw4w9WgXcQ"
          description="Learn React basics"
          locale="en"
        />
      );

      const externalLinks = screen.getAllByRole('link');
      expect(externalLinks.length).toBeGreaterThan(0);
      const youtubeLink = externalLinks.find((link) => link.getAttribute('href') === 'https://youtube.com/watch?v=dQw4w9WgXcQ');
      expect(youtubeLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Link with image (no YouTube ID)', () => {
    it('renders image thumbnail', () => {
      const { container } = render(
        <LinkRow
          label="GitHub"
          url="https://github.com"
          image="https://github.com/logo.png"
          description="GitHub repository"
          locale="en"
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://github.com/logo.png');
    });

    it('reserves space for image to prevent CLS', () => {
      const { container } = render(
        <LinkRow
          label="GitHub"
          url="https://github.com"
          image="https://github.com/logo.png"
          description="GitHub repository"
          locale="en"
        />
      );

      const thumbContainer = container.querySelector('.w-16.h-16');
      expect(thumbContainer).toBeInTheDocument();
    });

    it('renders label and description', () => {
      render(
        <LinkRow
          label="GitHub"
          url="https://github.com"
          image="https://github.com/logo.png"
          description="GitHub repository"
          locale="en"
        />
      );

      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('GitHub repository')).toBeInTheDocument();
    });

    it('falls back to plain link if image fails to load', () => {
      const { container } = render(
        <LinkRow
          label="GitHub"
          url="https://github.com"
          image="https://example.com/404.png"
          description="GitHub repository"
          locale="en"
        />
      );

      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      fireEvent.error(img);

      // After error, should render plain link (no thumbnail box visible)
      // The image should now be hidden/not rendered due to error state
      const newImg = container.querySelector('img');
      expect(newImg).not.toBeInTheDocument();
    });

    it('opens link in new tab', () => {
      render(
        <LinkRow
          label="GitHub"
          url="https://github.com"
          image="https://github.com/logo.png"
          description="GitHub repository"
          locale="en"
        />
      );

      const link = screen.getByRole('link', { name: /GitHub/ });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
