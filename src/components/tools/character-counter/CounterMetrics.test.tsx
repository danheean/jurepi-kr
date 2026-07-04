import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { CounterMetrics } from './CounterMetrics';
import type { CharacterCounterMetrics } from '@/lib/character-counter';

const mockMetrics: CharacterCounterMetrics = {
  charactersWithSpaces: 50,
  charactersWithoutSpaces: 40,
  words: 10,
  sentences: 2,
  paragraphs: 1,
  lines: 3,
  byteSize: 50,
  readingTimeMinutes: 0.1,
  speakingTimeMinutes: 0.1,
};

describe('CounterMetrics', () => {
  it('renders all metric labels', () => {
    render(<CounterMetrics metrics={mockMetrics} />);

    expect(screen.getByText('Characters (with spaces)')).toBeInTheDocument();
    expect(screen.getByText('Characters (no spaces)')).toBeInTheDocument();
    expect(screen.getByText('Words')).toBeInTheDocument();
    expect(screen.getByText('Sentences')).toBeInTheDocument();
    expect(screen.getByText('Paragraphs')).toBeInTheDocument();
    expect(screen.getByText('Lines')).toBeInTheDocument();
    expect(screen.getByText('Bytes (UTF-8)')).toBeInTheDocument();
    expect(screen.getByText('Reading time')).toBeInTheDocument();
    expect(screen.getByText('Speaking time')).toBeInTheDocument();
  });

  it('displays correct metric values', () => {
    const { container } = render(<CounterMetrics metrics={mockMetrics} />);

    // Use getAllByText to find specific metric values
    const fifties = screen.getAllByText('50');
    expect(fifties.length).toBeGreaterThanOrEqual(1); // charactersWithSpaces and byteSize

    expect(screen.getByText('40')).toBeInTheDocument(); // charactersWithoutSpaces
    expect(screen.getByText('10')).toBeInTheDocument(); // words
    expect(screen.getByText('2')).toBeInTheDocument(); // sentences
    expect(screen.getByText('1')).toBeInTheDocument(); // paragraphs
    expect(screen.getByText('3')).toBeInTheDocument(); // lines
  });

  it('displays time metrics with units', () => {
    render(<CounterMetrics metrics={mockMetrics} />);

    // Check that reading time and speaking time have "min" unit
    const minUnits = screen.getAllByText('min');
    expect(minUnits.length).toBeGreaterThanOrEqual(2);
  });

  it('handles zero metrics', () => {
    const zeroMetrics: CharacterCounterMetrics = {
      charactersWithSpaces: 0,
      charactersWithoutSpaces: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      byteSize: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
    };

    render(<CounterMetrics metrics={zeroMetrics} />);

    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(5);
  });

  it('displays primary metric (characters with spaces) with larger styling', () => {
    const { container } = render(<CounterMetrics metrics={mockMetrics} />);

    // Check for col-span-2 (indicates primary metric takes full width)
    const fullWidthDivs = container.querySelectorAll('.col-span-2');
    expect(fullWidthDivs.length).toBeGreaterThan(0);
  });
});
