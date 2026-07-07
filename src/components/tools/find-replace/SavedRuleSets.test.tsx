import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { SavedRuleSets } from './SavedRuleSets';
import type { SavedRuleSet, Rule } from '@/lib/find-replace';

describe('SavedRuleSets', () => {
  const mockRule: Rule = {
    id: 'rule-1',
    find: 'hello',
    replace: 'world',
    isRegex: false,
    caseSensitive: false,
    wholeWord: false,
    firstOnly: false,
    enabled: true,
  };

  const mockSets: SavedRuleSet[] = [
    {
      name: 'My Rules',
      rules: [mockRule],
    },
    {
      name: 'Cleanup Set',
      rules: [mockRule, mockRule],
    },
  ];

  it('renders empty state when no saved sets', () => {
    const onSave = vi.fn();
    const onApply = vi.fn();
    const onRemove = vi.fn();

    render(
      <SavedRuleSets
        savedSets={[]}
        onSaveRuleSet={onSave}
        onApplyRuleSet={onApply}
        onRemoveRuleSet={onRemove}
      />
    );

    expect(screen.getByText(/No saved/)).toBeInTheDocument();
  });

  it('displays saved rule sets with names and rule counts', () => {
    const onSave = vi.fn();
    const onApply = vi.fn();
    const onRemove = vi.fn();

    render(
      <SavedRuleSets
        savedSets={mockSets}
        onSaveRuleSet={onSave}
        onApplyRuleSet={onApply}
        onRemoveRuleSet={onRemove}
      />
    );

    expect(screen.getByText('My Rules')).toBeInTheDocument();
    expect(screen.getByText('Cleanup Set')).toBeInTheDocument();
    expect(screen.getByText('1 rule')).toBeInTheDocument();
    expect(screen.getByText('2 rules')).toBeInTheDocument();
  });

  it('calls onSaveRuleSet when save button is clicked with a name', async () => {
    const onSave = vi.fn();
    const onApply = vi.fn();
    const onRemove = vi.fn();

    render(
      <SavedRuleSets
        savedSets={[]}
        onSaveRuleSet={onSave}
        onApplyRuleSet={onApply}
        onRemoveRuleSet={onRemove}
      />
    );

    const input = screen.getByTestId('save-ruleset-input') as HTMLInputElement;
    await userEvent.type(input, 'New Set');

    await userEvent.click(screen.getByTestId('save-ruleset-button'));
    expect(onSave).toHaveBeenCalledWith('New Set');
  });

  it('disables save button when input is empty', () => {
    const onSave = vi.fn();
    const onApply = vi.fn();
    const onRemove = vi.fn();

    render(
      <SavedRuleSets
        savedSets={[]}
        onSaveRuleSet={onSave}
        onApplyRuleSet={onApply}
        onRemoveRuleSet={onRemove}
      />
    );

    expect(screen.getByTestId('save-ruleset-button')).toBeDisabled();
  });

  it('calls onApplyRuleSet when apply button is clicked', () => {
    const onSave = vi.fn();
    const onApply = vi.fn();
    const onRemove = vi.fn();

    render(
      <SavedRuleSets
        savedSets={mockSets}
        onSaveRuleSet={onSave}
        onApplyRuleSet={onApply}
        onRemoveRuleSet={onRemove}
      />
    );

    screen.getByTestId('apply-ruleset-My Rules').click();
    expect(onApply).toHaveBeenCalledWith('My Rules');
  });

  it('calls onRemoveRuleSet when delete button is clicked', () => {
    const onSave = vi.fn();
    const onApply = vi.fn();
    const onRemove = vi.fn();

    render(
      <SavedRuleSets
        savedSets={mockSets}
        onSaveRuleSet={onSave}
        onApplyRuleSet={onApply}
        onRemoveRuleSet={onRemove}
      />
    );

    screen.getByTestId('delete-ruleset-My Rules').click();
    expect(onRemove).toHaveBeenCalledWith('My Rules');
  });
});
