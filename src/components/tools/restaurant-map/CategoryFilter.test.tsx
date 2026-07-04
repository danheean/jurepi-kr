import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFilter } from './CategoryFilter';
import { renderWithIntl } from './test-utils';

describe('CategoryFilter', () => {
  it('renders all category pills', () => {
    const onCategoryChange = vi.fn();
    renderWithIntl(
      <CategoryFilter activeCategory="all" onCategoryChange={onCategoryChange} />
    );

    // All categories should be present
    expect(screen.getByRole('button', { name: /All Categories/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Café/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Korean/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Japanese/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chinese/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Brunch/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dessert/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Other/i })).toBeInTheDocument();
  });

  it('renders pills in the correct order', () => {
    const onCategoryChange = vi.fn();
    renderWithIntl(
      <CategoryFilter activeCategory="all" onCategoryChange={onCategoryChange} />
    );

    const buttons = screen.getAllByRole('button');
    // Order: all, cafe, korean, japanese, chinese, brunch, bar, dessert, other
    expect(buttons).toHaveLength(9);
  });

  it('applies active styling to selected category', () => {
    const onCategoryChange = vi.fn();
    const { container } = renderWithIntl(
      <CategoryFilter activeCategory="cafe" onCategoryChange={onCategoryChange} />
    );

    const buttons = container.querySelectorAll('button');
    // Find the cafe button (second one)
    const cafeButton = Array.from(buttons).find((btn) => btn.textContent?.includes('Café'));

    expect(cafeButton).toHaveClass('bg-brand');
    expect(cafeButton).toHaveClass('text-on-brand');
  });

  it('applies inactive styling to non-selected categories', () => {
    const onCategoryChange = vi.fn();
    const { container } = renderWithIntl(
      <CategoryFilter activeCategory="cafe" onCategoryChange={onCategoryChange} />
    );

    const buttons = container.querySelectorAll('button');
    // Find the korean button (third one)
    const koreanButton = Array.from(buttons).find((btn) => btn.textContent?.includes('Korean'));

    expect(koreanButton).toHaveClass('bg-surface-muted');
    expect(koreanButton).toHaveClass('text-text-secondary');
  });

  it('calls onCategoryChange when a pill is clicked', async () => {
    const onCategoryChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <CategoryFilter activeCategory="all" onCategoryChange={onCategoryChange} />
    );

    const koreanButton = screen.getByRole('button', { name: /Korean/i });
    await user.click(koreanButton);

    expect(onCategoryChange).toHaveBeenCalledWith('korean');
  });

  it('can switch between categories', async () => {
    const onCategoryChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithIntl(
      <CategoryFilter activeCategory="all" onCategoryChange={onCategoryChange} />
    );

    // Click on cafe
    const cafeButton = screen.getByRole('button', { name: /Café/i });
    await user.click(cafeButton);
    expect(onCategoryChange).toHaveBeenCalledWith('cafe');

    // Rerender with new active category
    rerender(
      <CategoryFilter activeCategory="cafe" onCategoryChange={onCategoryChange} />
    );

    // Cafe button should now have active styling
    expect(cafeButton).toHaveClass('bg-brand');
    expect(cafeButton).toHaveClass('text-on-brand');

    // Click on korean
    const koreanButton = screen.getByRole('button', { name: /Korean/i });
    await user.click(koreanButton);
    expect(onCategoryChange).toHaveBeenCalledWith('korean');
  });

  it('uses i18n for category labels', () => {
    const onCategoryChange = vi.fn();
    renderWithIntl(
      <CategoryFilter activeCategory="all" onCategoryChange={onCategoryChange} />
    );

    // All labels should come from i18n (English in this test)
    expect(screen.getByRole('button', { name: 'All Categories' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Café' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bar' })).toBeInTheDocument();
  });

  it('renders as button elements', () => {
    const onCategoryChange = vi.fn();
    renderWithIntl(
      <CategoryFilter activeCategory="all" onCategoryChange={onCategoryChange} />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn.tagName).toBe('BUTTON');
    });
  });

  it('has transition classes for smooth state changes', () => {
    const onCategoryChange = vi.fn();
    const { container } = renderWithIntl(
      <CategoryFilter activeCategory="all" onCategoryChange={onCategoryChange} />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveClass('transition-colors');
    });
  });

  it('has hover state for inactive pills', () => {
    const onCategoryChange = vi.fn();
    const { container } = renderWithIntl(
      <CategoryFilter activeCategory="cafe" onCategoryChange={onCategoryChange} />
    );

    const buttons = container.querySelectorAll('button');
    // Find an inactive button
    const inactiveButton = Array.from(buttons).find((btn) => !btn.classList.contains('bg-brand'));

    expect(inactiveButton).toHaveClass('hover:bg-surface-sunken');
  });

  it('renders full width pills with rounded styling', () => {
    const onCategoryChange = vi.fn();
    const { container } = renderWithIntl(
      <CategoryFilter activeCategory="all" onCategoryChange={onCategoryChange} />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveClass('rounded-full');
      expect(btn).toHaveClass('px-4');
      expect(btn).toHaveClass('py-2');
    });
  });

  it('has medium font weight for pill text', () => {
    const onCategoryChange = vi.fn();
    const { container } = renderWithIntl(
      <CategoryFilter activeCategory="all" onCategoryChange={onCategoryChange} />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveClass('font-medium');
    });
  });

  it('renders only categories present in the catalog when availableCategories is given', () => {
    // Regression: hardcoded full list exposed dead filters (e.g. '기타' with
    // zero places) whose empty result screen read as an error.
    const onCategoryChange = vi.fn();
    renderWithIntl(
      <CategoryFilter
        activeCategory="all"
        onCategoryChange={onCategoryChange}
        availableCategories={['cafe', 'korean']}
      />,
      { locale: 'ko' }
    );

    expect(screen.getByRole('button', { name: '전체 카테고리' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '카페' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '한식' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '기타' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '일식' })).not.toBeInTheDocument();
  });
});
