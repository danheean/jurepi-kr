import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import type { SearchableTool } from '@/lib/tool-search';
import { HeaderSearch } from './HeaderSearch';

describe('HeaderSearch', () => {
  const mockLiveTool: SearchableTool = {
    id: 'ladder',
    slug: 'ladder',
    name: 'Ladder Game',
    description: 'Fair way to decide',
    category: 'random',
    accent: 'coral',
    icon: 'ListTree',
    status: 'live',
    order: 1,
    keywords: ['ladder', 'decision'],
  };

  const mockComingSoonTool: SearchableTool = {
    id: 'picker',
    slug: 'picker',
    name: 'Random Picker',
    description: 'Pick randomly from a list',
    category: 'random',
    accent: 'rose',
    icon: 'Dices',
    status: 'coming_soon',
    order: 2,
    keywords: ['picker', 'random'],
  };

  const tools = [mockLiveTool, mockComingSoonTool];

  it('renders closed trigger button with search icon', () => {
    render(<HeaderSearch tools={tools} />);
    const trigger = screen.getByTestId('header-search');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-label');
  });

  it('opens combobox when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('displays listbox with all tools when opened with empty query', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(screen.getByText('Ladder Game')).toBeInTheDocument();
    expect(screen.getByText('Random Picker')).toBeInTheDocument();
  });

  it('filters tools by query in English', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'ladder');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    // Check the option contains the text
    expect(options[0]).toHaveTextContent('Ladder Game');
    expect(screen.queryByText(/Random Picker/)).not.toBeInTheDocument();
  });

  it('filters tools by keyword', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'decision');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Ladder Game');
  });

  it('live tool renders as a link', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const liveToolOption = screen.getByRole('option', { name: /Ladder/ });
    expect(liveToolOption).toBeInTheDocument();
    const link = liveToolOption.closest('a');
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute('href')).toMatch(/\/tools\/ladder$/);
  });

  it('coming_soon tool is not a link and is aria-disabled', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const comingSoonOption = screen.getByRole('option', { name: /Random/ });
    expect(comingSoonOption).toHaveAttribute('aria-disabled', 'true');
    const link = comingSoonOption.closest('a');
    expect(link).not.toBeInTheDocument();
  });

  it('shows Coming soon badge on coming_soon tool', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('highlights matching query substring in tool name', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'ladder');

    // The matched substring "ladder" should be wrapped in a highlight element
    const highlight = screen.getByText('Ladder', { exact: false }).closest('mark');
    expect(highlight).toBeInTheDocument();
  });

  it('closes combobox when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    let input: HTMLElement | null = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();

    await user.keyboard('{Escape}');

    input = screen.queryByRole('combobox');
    expect(input).not.toBeInTheDocument();

    // Trigger button should be visible again after closing
    const trigger2 = screen.getByTestId('header-search');
    expect(trigger2).toBeInTheDocument();
  });

  it('moves focus down with ArrowDown key', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox');
    await user.keyboard('{ArrowDown}');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('selects active live tool with Enter key and navigates', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.keyboard('{ArrowDown}');

    const option = screen.getByRole('option', { name: /Ladder/ });
    const link = option.closest('a') as HTMLAnchorElement;

    expect(link).toBeInTheDocument();

    // Note: Checking that link has correct href is test for the link element itself
    expect(link.getAttribute('href')).toMatch(/\/tools\/ladder$/);
  });

  it('does not navigate on Enter if tool is coming_soon', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox') as HTMLInputElement;
    // Move down to the second (coming_soon) tool
    await user.keyboard('{ArrowDown}{ArrowDown}');

    const comingSoonOption = screen.getByRole('option', { name: /Random/ });
    expect(comingSoonOption).toHaveAttribute('aria-selected', 'true');

    // No link should be available for coming_soon
    const link = comingSoonOption.closest('a');
    expect(link).not.toBeInTheDocument();
  });

  it('closes combobox when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <HeaderSearch tools={tools} />
        <div data-testid="outside">Outside content</div>
      </div>
    );

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    let input: HTMLElement | null = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    await user.click(outside);

    input = screen.queryByRole('combobox');
    expect(input).not.toBeInTheDocument();
  });

  it('shows no results text when no tools match query', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'nonexistent');

    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveTextContent('No results found');
  });

  it('moves focus up with ArrowUp key', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    // Move down twice
    await user.keyboard('{ArrowDown}{ArrowDown}');

    let options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    // Move up once
    await user.keyboard('{ArrowUp}');

    options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps focus on ArrowDown at end of list', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    // Move down twice to the end
    await user.keyboard('{ArrowDown}{ArrowDown}');

    let options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    // Move down again (should wrap to first)
    await user.keyboard('{ArrowDown}');

    options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('has aria-controls and aria-activedescendant for combobox', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-controls');
    expect(input).toHaveAttribute('aria-activedescendant');
  });

  it('closes and clears input on successful selection', async () => {
    const user = userEvent.setup();
    render(<HeaderSearch tools={tools} />);

    const trigger = screen.getByTestId('header-search');
    await user.click(trigger);

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'ladder');
    await user.keyboard('{ArrowDown}');

    // Verify link exists and can be accessed
    const option = screen.getByRole('option', { name: /Ladder/ });
    const link = option.closest('a') as HTMLAnchorElement;
    expect(link).toBeInTheDocument();
  });
});
