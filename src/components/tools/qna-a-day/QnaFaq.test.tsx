import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QnaFaq } from './QnaFaq';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      if (key === 'faq.heading') return 'FAQ';
      return key;
    };

    // Add the raw method
    t.raw = (key: string) => {
      if (key === 'faq.items') {
        return Array.from({ length: 9 }, (_, i) => ({
          q: `Question ${i}`,
          a: `Answer ${i}`,
        }));
      }
      return key;
    };

    return t;
  },
}));

describe('QnaFaq', () => {
  it('renders FAQ heading', () => {
    render(<QnaFaq />);

    expect(screen.getByText('FAQ')).toBeInTheDocument();
  });

  it('renders 9 FAQ items', () => {
    render(<QnaFaq />);

    // Should render 9 questions
    for (let i = 0; i < 9; i++) {
      expect(screen.getByText(`Question ${i}`)).toBeInTheDocument();
    }
  });

  it('renders FAQ items with disclosure pattern', () => {
    render(<QnaFaq />);

    // Each item should be in a details element
    const questionTexts = Array.from({ length: 9 }, (_, i) => `Question ${i}`);

    questionTexts.forEach((q) => {
      const element = screen.getByText(q);
      // Should be inside a summary (part of details)
      expect(element.closest('summary')).toBeInTheDocument();
    });
  });

  it('emits FAQPage JSON-LD schema', () => {
    render(<QnaFaq />);

    // Check for script tag with FAQPage schema
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const faqScript = Array.from(scripts).find((script) => {
      try {
        const json = JSON.parse(script.textContent || '');
        return json['@type'] === 'FAQPage';
      } catch {
        return false;
      }
    });

    expect(faqScript).toBeDefined();

    if (faqScript) {
      const json = JSON.parse(faqScript.textContent || '');
      expect(json['@context']).toBe('https://schema.org');
      expect(json.mainEntity).toHaveLength(9);
      expect(json.mainEntity[0]['@type']).toBe('Question');
      expect(json.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    }
  });

  it('renders answer text for each FAQ item', () => {
    render(<QnaFaq />);

    for (let i = 0; i < 9; i++) {
      expect(screen.getByText(`Answer ${i}`)).toBeInTheDocument();
    }
  });
});
