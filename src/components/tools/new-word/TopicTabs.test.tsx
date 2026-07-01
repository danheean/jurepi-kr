import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { TopicTabs } from './TopicTabs';

describe('TopicTabs', () => {
  it('renders all default topics', () => {
    render(
      <TopicTabs
        activeTopic="all"
        setActiveTopic={vi.fn()}
        favCount={0}
        recentCount={0}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('MZ Slang')).toBeInTheDocument();
    expect(screen.getByText('Tech Terms')).toBeInTheDocument();
  });

  it('shows favorites tab when favCount > 0', () => {
    render(
      <TopicTabs
        activeTopic="all"
        setActiveTopic={vi.fn()}
        favCount={5}
        recentCount={0}
      />
    );

    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('hides favorites tab when favCount is 0', () => {
    render(
      <TopicTabs
        activeTopic="all"
        setActiveTopic={vi.fn()}
        favCount={0}
        recentCount={0}
      />
    );

    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
  });

  it('shows recent tab when recentCount > 0', () => {
    render(
      <TopicTabs
        activeTopic="all"
        setActiveTopic={vi.fn()}
        favCount={0}
        recentCount={3}
      />
    );

    expect(screen.getByText('Recent')).toBeInTheDocument();
  });

  it('hides recent tab when recentCount is 0', () => {
    render(
      <TopicTabs
        activeTopic="all"
        setActiveTopic={vi.fn()}
        favCount={0}
        recentCount={0}
      />
    );

    expect(screen.queryByText('Recent')).not.toBeInTheDocument();
  });

  it('calls setActiveTopic when a tab is clicked', async () => {
    const setActiveTopic = vi.fn();
    render(
      <TopicTabs
        activeTopic="all"
        setActiveTopic={setActiveTopic}
        favCount={0}
        recentCount={0}
      />
    );

    const mzTab = screen.getByTestId('topic-tab-mz');
    await userEvent.click(mzTab);

    expect(setActiveTopic).toHaveBeenCalledWith('mz');
  });

  it('marks active topic with aria-selected and styling', () => {
    render(
      <TopicTabs
        activeTopic="mz"
        setActiveTopic={vi.fn()}
        favCount={0}
        recentCount={0}
      />
    );

    const mzTab = screen.getByTestId('topic-tab-mz');
    expect(mzTab).toHaveAttribute('aria-selected', 'true');
    expect(mzTab).toHaveClass('bg-brand');
  });

  it('shows inactive tabs with different styling', () => {
    render(
      <TopicTabs
        activeTopic="mz"
        setActiveTopic={vi.fn()}
        favCount={0}
        recentCount={0}
      />
    );

    const allTab = screen.getByTestId('topic-tab-all');
    expect(allTab).toHaveAttribute('aria-selected', 'false');
    expect(allTab).toHaveClass('bg-surface-muted');
  });

  it('navigates to previous tab with ArrowLeft', async () => {
    const setActiveTopic = vi.fn();
    const { container } = render(
      <TopicTabs
        activeTopic="tech"
        setActiveTopic={setActiveTopic}
        favCount={0}
        recentCount={0}
      />
    );

    const techTab = screen.getByTestId('topic-tab-tech');
    techTab.focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(setActiveTopic).toHaveBeenCalledWith('mz');
  });

  it('navigates to next tab with ArrowRight', async () => {
    const setActiveTopic = vi.fn();
    render(
      <TopicTabs
        activeTopic="all"
        setActiveTopic={setActiveTopic}
        favCount={0}
        recentCount={0}
      />
    );

    const allTab = screen.getByTestId('topic-tab-all');
    allTab.focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(setActiveTopic).toHaveBeenCalledWith('mz');
  });

  it('does not navigate left when on first tab', async () => {
    const setActiveTopic = vi.fn();
    render(
      <TopicTabs
        activeTopic="all"
        setActiveTopic={setActiveTopic}
        favCount={0}
        recentCount={0}
      />
    );

    const allTab = screen.getByTestId('topic-tab-all');
    allTab.focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(setActiveTopic).not.toHaveBeenCalled();
  });

  it('does not navigate right when on last tab', async () => {
    const setActiveTopic = vi.fn();
    render(
      <TopicTabs
        activeTopic="tech"
        setActiveTopic={setActiveTopic}
        favCount={0}
        recentCount={0}
      />
    );

    const techTab = screen.getByTestId('topic-tab-tech');
    techTab.focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(setActiveTopic).not.toHaveBeenCalled();
  });

  it('has tablist role for accessibility', () => {
    const { container } = render(
      <TopicTabs
        activeTopic="all"
        setActiveTopic={vi.fn()}
        favCount={0}
        recentCount={0}
      />
    );

    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toBeInTheDocument();
  });
});
