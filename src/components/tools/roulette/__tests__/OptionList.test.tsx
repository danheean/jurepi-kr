import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { OptionList } from '../OptionList';
import type { Option } from '@/lib/roulette/schema';

describe('OptionList', () => {
  const defaultMessages = screen.getByText;

  const mockOptions: Option[] = [
    { label: 'Pizza', weight: 1 },
    { label: 'Pasta', weight: 2 },
  ];

  it('renders empty state when no options', () => {
    const { container } = render(
      <OptionList
        options={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    // Check for empty message
    expect(container.textContent).toContain('Please add at least one option');
  });

  it('renders input field with placeholder', () => {
    render(
      <OptionList
        options={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('e.g., Pizza');
    expect(input).toBeInTheDocument();
  });

  it('calls onAdd with label and weight on button click', async () => {
    const onAdd = vi.fn();
    render(
      <OptionList
        options={[]}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const labelInput = screen.getByPlaceholderText('e.g., Pizza') as HTMLInputElement;
    const weightInput = screen.getByRole('spinbutton', { name: 'Weight' }) as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: 'Add' });

    await userEvent.type(labelInput, 'Pizza');
    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '2');
    await userEvent.click(addButton);

    expect(onAdd).toHaveBeenCalledWith('Pizza', 2);
  });

  it('calls onAdd on Enter key press in label input', async () => {
    const onAdd = vi.fn();
    render(
      <OptionList
        options={[]}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const labelInput = screen.getByPlaceholderText('e.g., Pizza');
    const weightInput = screen.getByRole('spinbutton', { name: 'Weight' });

    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '3');
    await userEvent.type(labelInput, 'Burger{Enter}');

    expect(onAdd).toHaveBeenCalledWith('Burger', 3);
  });

  it('clears input fields after successful add', async () => {
    const onAdd = vi.fn();
    render(
      <OptionList
        options={[]}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const labelInput = screen.getByPlaceholderText('e.g., Pizza') as HTMLInputElement;
    const weightInput = screen.getByRole('spinbutton', { name: 'Weight' }) as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: 'Add' });

    await userEvent.type(labelInput, 'Pizza');
    await userEvent.click(addButton);

    expect(labelInput.value).toBe('');
    expect(weightInput.value).toBe('1');
  });

  it('disables inputs and button when maxReached is true', () => {
    render(
      <OptionList
        options={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        maxReached={true}
      />
    );

    const labelInput = screen.getByPlaceholderText('e.g., Pizza');
    const weightInput = screen.getByRole('spinbutton', { name: 'Weight' });
    const addButton = screen.getByRole('button', { name: 'Add' });

    expect(labelInput).toBeDisabled();
    expect(weightInput).toBeDisabled();
    expect(addButton).toBeDisabled();
  });

  it('renders option rows with labels and weights', () => {
    render(
      <OptionList
        options={mockOptions}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    // Check label via aria-label
    const labelInputs = screen.getAllByRole('textbox');
    expect(labelInputs[1]).toHaveValue('Pizza'); // Second textbox (first is add input)
    expect(labelInputs[2]).toHaveValue('Pasta');
  });

  it('calls onRemove when delete button is clicked', async () => {
    const onRemove = vi.fn();
    render(
      <OptionList
        options={mockOptions}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={onRemove}
      />
    );

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    await userEvent.click(deleteButtons[0]);

    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it('disables up reorder button for first option', () => {
    render(
      <OptionList
        options={mockOptions}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onReorderUp={vi.fn()}
        onReorderDown={vi.fn()}
      />
    );

    // Up button for first option should be disabled
    const upButtons = screen.getAllByRole('button', { name: 'Move up' });
    expect(upButtons[0]).toBeDisabled();
  });

  it('disables down reorder button for last option', () => {
    render(
      <OptionList
        options={mockOptions}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onReorderUp={vi.fn()}
        onReorderDown={vi.fn()}
      />
    );

    // Down button for last option should be disabled
    const downButtons = screen.getAllByRole('button', { name: 'Move down' });
    expect(downButtons[downButtons.length - 1]).toBeDisabled();
  });

  it('calls onReorderUp when up button is clicked', async () => {
    const onReorderUp = vi.fn();
    render(
      <OptionList
        options={mockOptions}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onReorderUp={onReorderUp}
        onReorderDown={vi.fn()}
      />
    );

    const upButtons = screen.getAllByRole('button', { name: 'Move up' });
    await userEvent.click(upButtons[1]); // Click up button for second option

    expect(onReorderUp).toHaveBeenCalledWith(1);
  });

  it('calls onReorderDown when down button is clicked', async () => {
    const onReorderDown = vi.fn();
    render(
      <OptionList
        options={mockOptions}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onReorderUp={vi.fn()}
        onReorderDown={onReorderDown}
      />
    );

    const downButtons = screen.getAllByRole('button', { name: 'Move down' });
    await userEvent.click(downButtons[0]); // Click down button for first option

    expect(onReorderDown).toHaveBeenCalledWith(0);
  });

  it('connects label input with aria-label', () => {
    render(
      <OptionList
        options={mockOptions}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const labelInputs = screen.getAllByRole('textbox');
    // Second textbox should have aria-label mentioning "Add Option 1"
    expect(labelInputs[1]).toHaveAttribute('aria-label', 'Add Option 1');
    expect(labelInputs[2]).toHaveAttribute('aria-label', 'Add Option 2');
  });
});
