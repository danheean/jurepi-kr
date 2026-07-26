import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { NewWordSpoke } from './NewWordSpoke';
import { MergedTerm } from '@/lib/new-word/schema';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

// Mock the Markdown component
vi.mock('@/components/markdown', () => ({
  Markdown: ({ children }: { children: string }) => (
    <div data-testid="markdown-content">{children}</div>
  ),
}));

describe('NewWordSpoke', () => {
  const mockTerm: MergedTerm = {
    slug: 'test-term',
    topic: 'mz',
    tone: 'positive',
    coinedYear: 2023,
    related: ['related-term-1'],
    ko: {
      term: '테스트 용어',
      definition: '테스트 용어의 정의입니다.',
      examples: ['예시 1', '예시 2'],
      body: '## 상세 설명\n본문입니다.',
      reading: '테스트용어',
      origin: '테스트에서 유래',
      tags: ['tag1', 'tag2'],
    },
    en: {
      term: 'test term',
      definition: 'This is a test term definition.',
      examples: ['Example 1', 'Example 2'],
      body: '## Detailed explanation\nBody text.',
      reading: 'test term',
      origin: 'Derived from test',
      tags: ['tag1', 'tag2'],
    },
  };

  const relatedTerm: MergedTerm = {
    slug: 'related-term-1',
    topic: 'tech',
    related: [],
    ko: {
      term: '관련 용어',
      definition: '관련 용어 정의',
      examples: [],
      body: '',
    },
    en: {
      term: 'related term',
      definition: 'Related term definition',
      examples: [],
      body: '',
    },
  };

  const mockCatalog: MergedTerm[] = [mockTerm, relatedTerm];

  const renderWithMessages = (
    component: React.ReactElement,
    locale: 'ko' | 'en'
  ) => {
    // Pass each locale's literal messages directly (matching sibling tests);
    // a ternary would widen to a union type that next-intl's prop rejects.
    return locale === 'ko'
      ? render(
          <NextIntlClientProvider locale="ko" messages={messagesKo as any}>
            {component}
          </NextIntlClientProvider>
        )
      : render(
          <NextIntlClientProvider locale="en" messages={messagesEn as any}>
            {component}
          </NextIntlClientProvider>
        );
  };

  describe('Korean locale', () => {
    it('renders breadcrumb with correct links', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      const breadcrumb = screen.getByTestId('spoke-breadcrumb');
      expect(breadcrumb).toBeInTheDocument();
      expect(breadcrumb).toHaveTextContent('홈');
      expect(breadcrumb).toHaveTextContent('신조어 용어사전');
      expect(breadcrumb).toHaveTextContent('테스트 용어');
    });

    it('renders h1 and reading', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('테스트 용어');
      expect(screen.getByText('테스트용어')).toBeInTheDocument();
    });

    it('renders definition', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      expect(screen.getByText('뜻')).toBeInTheDocument();
      expect(screen.getByText('테스트 용어의 정의입니다.')).toBeInTheDocument();
    });

    it('renders examples', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      // Check that examples section exists
      const article = screen.getByRole('article');
      const text = article.textContent || '';
      expect(text).toContain('예시');
      // Check that example values are present (via text content)
      expect(text).toContain('예시 1');
      expect(text).toContain('예시 2');
    });

    it('renders origin', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      expect(screen.getByText('유래')).toBeInTheDocument();
      expect(screen.getByText('테스트에서 유래')).toBeInTheDocument();
    });

    it('renders markdown body', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toBeInTheDocument();
      // Mock receives the body as-is, just check it exists
      expect(markdownContent.textContent).toContain('상세 설명');
      expect(markdownContent.textContent).toContain('본문입니다');
    });

    it('renders meta chips', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      expect(screen.getByTestId('spoke-topic-chip')).toHaveTextContent('MZ');
      expect(screen.getByTestId('spoke-tone-chip')).toHaveTextContent('긍정');
      expect(screen.getByTestId('spoke-coined-year-chip')).toHaveTextContent(
        '2023'
      );
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('renders related terms with correct links', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      // Check that the related heading exists
      const headings = screen.getAllByRole('heading');
      expect(headings.some((h) => h.textContent === '관련 용어')).toBe(true);

      const relatedLink = screen.getByTestId('spoke-related-link-related-term-1');
      expect(relatedLink).toHaveTextContent('관련 용어');
      expect(relatedLink).toHaveAttribute('href', '/ko/tools/new-word/related-term-1');
    });

    it('renders back to hub link', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      const backLink = screen.getByTestId('spoke-back-to-hub');
      expect(backLink).toHaveTextContent('← 전체 용어 보기');
      expect(backLink).toHaveAttribute('href', '/ko/tools/new-word');
    });
  });

  describe('English locale', () => {
    it('renders breadcrumb in English', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="en" catalog={mockCatalog} />,
        'en'
      );

      const breadcrumb = screen.getByTestId('spoke-breadcrumb');
      expect(breadcrumb).toHaveTextContent('Home');
      expect(breadcrumb).toHaveTextContent('New Word Glossary');
      expect(breadcrumb).toHaveTextContent('test term');
    });

    it('renders definition in English', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="en" catalog={mockCatalog} />,
        'en'
      );

      expect(screen.getByText('Definition')).toBeInTheDocument();
      expect(
        screen.getByText('This is a test term definition.')
      ).toBeInTheDocument();
    });

    it('renders back link in English', () => {
      renderWithMessages(
        <NewWordSpoke term={mockTerm} locale="en" catalog={mockCatalog} />,
        'en'
      );

      const backLink = screen.getByTestId('spoke-back-to-hub');
      expect(backLink).toHaveTextContent('← Browse all terms');
      expect(backLink).toHaveAttribute('href', '/en/tools/new-word');
    });
  });

  describe('edge cases', () => {
    it('handles missing reading gracefully', () => {
      const termNoReading: MergedTerm = {
        ...mockTerm,
        ko: {
          ...mockTerm.ko,
          reading: undefined,
        },
      };

      renderWithMessages(
        <NewWordSpoke term={termNoReading} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      // Check that h1 exists with the term name
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('테스트 용어');
      // Reading should not be present
      expect(screen.queryByText('테스트용어')).not.toBeInTheDocument();
    });

    it('handles missing origin gracefully', () => {
      const termNoOrigin: MergedTerm = {
        ...mockTerm,
        ko: {
          ...mockTerm.ko,
          origin: undefined,
        },
      };

      renderWithMessages(
        <NewWordSpoke term={termNoOrigin} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      expect(screen.queryByText('유래')).not.toBeInTheDocument();
      expect(screen.queryByText('테스트에서 유래')).not.toBeInTheDocument();
    });

    it('handles missing body gracefully', () => {
      const termNoBody: MergedTerm = {
        ...mockTerm,
        ko: {
          ...mockTerm.ko,
          body: '',
        },
      };

      renderWithMessages(
        <NewWordSpoke term={termNoBody} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
    });

    it('handles missing related terms gracefully', () => {
      const termNoRelated: MergedTerm = {
        ...mockTerm,
        related: [],
      };

      renderWithMessages(
        <NewWordSpoke
          term={termNoRelated}
          locale="ko"
          catalog={mockCatalog}
        />,
        'ko'
      );

      expect(screen.queryByText('관련 용어')).not.toBeInTheDocument();
    });

    it('filters out non-existent related terms', () => {
      const termWithMissingRelated: MergedTerm = {
        ...mockTerm,
        related: ['related-term-1', 'non-existent-term'],
      };

      renderWithMessages(
        <NewWordSpoke
          term={termWithMissingRelated}
          locale="ko"
          catalog={mockCatalog}
        />,
        'ko'
      );

      expect(screen.getByTestId('spoke-related-link-related-term-1')).toBeInTheDocument();
      expect(
        screen.queryByTestId('spoke-related-link-non-existent-term')
      ).not.toBeInTheDocument();
    });

    it('handles missing coinedYear gracefully', () => {
      const termNoYear: MergedTerm = {
        ...mockTerm,
        coinedYear: undefined,
      };

      renderWithMessages(
        <NewWordSpoke term={termNoYear} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      expect(screen.queryByTestId('spoke-coined-year-chip')).not.toBeInTheDocument();
    });

    it('handles missing tone gracefully', () => {
      const termNoTone: MergedTerm = {
        ...mockTerm,
        tone: undefined,
      };

      renderWithMessages(
        <NewWordSpoke term={termNoTone} locale="ko" catalog={mockCatalog} />,
        'ko'
      );

      expect(screen.queryByTestId('spoke-tone-chip')).not.toBeInTheDocument();
    });
  });
});
