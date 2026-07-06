import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent, fireEvent } from '@/__test__/test-utils';
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

    const input = screen.getByPlaceholderText('e.g., Pizza, Pasta, Salad (commas add several)');
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

    const labelInput = screen.getByPlaceholderText('e.g., Pizza, Pasta, Salad (commas add several)') as HTMLInputElement;
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

    const labelInput = screen.getByPlaceholderText('e.g., Pizza, Pasta, Salad (commas add several)');
    const weightInput = screen.getByRole('spinbutton', { name: 'Weight' });

    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '3');
    await userEvent.type(labelInput, 'Burger{Enter}');

    expect(onAdd).toHaveBeenCalledWith('Burger', 3);
  });

  it('ignores Enter fired during IME composition (한글 조합 중 Enter 중복 추가 방지)', async () => {
    // 한글 IME에서 "자장면"+Enter는 조합 확정 keydown(isComposing=true)과
    // 실제 keydown(isComposing=false)을 연달아 발화한다 — 조합 중 이벤트를
    // 처리하면 "자장면"과 잔여 글자 "면"이 두 번 추가된다.
    const onAdd = vi.fn();
    render(
      <OptionList
        options={[]}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const labelInput = screen.getByPlaceholderText('e.g., Pizza, Pasta, Salad (commas add several)');
    fireEvent.change(labelInput, { target: { value: '자장면' } });

    // 조합 중 Enter → 무시되어야 한다
    fireEvent.keyDown(labelInput, { key: 'Enter', isComposing: true });
    expect(onAdd).not.toHaveBeenCalled();

    // 조합 종료 후 실제 Enter → 1회만 추가
    fireEvent.keyDown(labelInput, { key: 'Enter', isComposing: false });
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith('자장면', 1);
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

    const labelInput = screen.getByPlaceholderText('e.g., Pizza, Pasta, Salad (commas add several)') as HTMLInputElement;
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

    const labelInput = screen.getByPlaceholderText('e.g., Pizza, Pasta, Salad (commas add several)');
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
