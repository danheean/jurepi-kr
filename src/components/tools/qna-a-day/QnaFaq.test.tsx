import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QnaFaq } from './QnaFaq';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    // Return test data based on key
    if (key === 'faq.heading') return 'FAQ';
    if (key.startsWith('faq.items.')) {
      const match = key.match(/faq\.items\.(\d+)\.(q|a)/);
      if (match) {
        const idx = match[1];
        const type = match[2];
        return type === 'q' ? `Question ${idx}` : `Answer ${idx}`;
      }
    }
    return key;
  },
}));

describe('QnaFaq', () => {
  it('renders FAQ heading', () => {
    render(<QnaFaq />);

    expect(screen.getByText('FAQ')).toBeInTheDocument();
  });

  it('renders 7 FAQ items', () => {
    render(<QnaFaq />);

    // Should render 7 questions
    for (let i = 0; i < 7; i++) {
      expect(screen.getByText(`Question ${i}`)).toBeInTheDocument();
    }
  });

  it('renders FAQ items with disclosure pattern', () => {
    render(<QnaFaq />);

    // Each item should be in a details element
    const questionTexts = Array.from({ length: 7 }, (_, i) => `Question ${i}`);

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
      expect(json.mainEntity).toHaveLength(7);
      expect(json.mainEntity[0]['@type']).toBe('Question');
      expect(json.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    }
  });

  it('renders answer text for each FAQ item', () => {
    render(<QnaFaq />);

    for (let i = 0; i < 7; i++) {
      expect(screen.getByText(`Answer ${i}`)).toBeInTheDocument();
    }
  });
});
