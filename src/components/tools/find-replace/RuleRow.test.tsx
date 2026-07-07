import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { RuleRow } from './RuleRow';
import type { Rule } from '@/lib/find-replace';

describe('RuleRow', () => {
  const baseRule: Rule = {
    id: 'rule-1',
    find: 'hello',
    replace: 'world',
    isRegex: false,
    caseSensitive: false,
    wholeWord: false,
    firstOnly: false,
    enabled: true,
  };

  it('renders find and replace inputs with correct labels', () => {
    render(
      <RuleRow
        rule={baseRule}
        index={0}
        totalRules={1}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Find')).toHaveValue('hello');
    expect(screen.getByLabelText('Replace with')).toHaveValue('world');
  });

  it('calls onUpdate when find input changes', async () => {
    const onUpdate = vi.fn();
    render(
      <RuleRow
        rule={baseRule}
        index={0}
        totalRules={1}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    const findInput = screen.getByLabelText('Find') as HTMLInputElement;
    await userEvent.type(findInput, 'X');

    expect(onUpdate).toHaveBeenCalled();
    // Verify at least one call has the 'find' key
    expect(onUpdate.mock.calls.some((call) => call[0].find !== undefined)).toBe(true);
  });

  it('toggles option buttons and updates rule', () => {
    const onUpdate = vi.fn();
    render(
      <RuleRow
        rule={baseRule}
        index={0}
        totalRules={1}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    const caseSensitiveButton = screen.getByTestId('rule-toggle-caseSensitive-rule-1');
    expect(caseSensitiveButton).toHaveAttribute('aria-pressed', 'false');

    caseSensitiveButton.click();
    expect(onUpdate).toHaveBeenCalledWith({ caseSensitive: true });
  });

  it('regex toggle updates the isRegex field (not a phantom "regex" key)', () => {
    const onUpdate = vi.fn();
    render(
      <RuleRow
        rule={baseRule}
        index={0}
        totalRules={1}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    const regexButton = screen.getByTestId('rule-toggle-isRegex-rule-1');
    expect(regexButton).toHaveAttribute('aria-pressed', 'false');

    regexButton.click();
    // Must flip the actual Rule field `isRegex` so the domain runs in regex mode.
    expect(onUpdate).toHaveBeenCalledWith({ isRegex: true });
    expect(onUpdate).not.toHaveBeenCalledWith({ regex: true });
  });

  it('shows flags input only when regex is enabled', () => {
    const regexRule: Rule = {
      ...baseRule,
      isRegex: true,
      flags: 'gi',
    };

    render(
      <RuleRow
        rule={regexRule}
        index={0}
        totalRules={1}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(screen.getByTestId('rule-flags-rule-1')).toHaveValue('gi');
  });

  it('does not show flags input when regex is disabled', () => {
    render(
      <RuleRow
        rule={baseRule}
        index={0}
        totalRules={1}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(screen.queryByTestId('rule-flags-rule-1')).not.toBeInTheDocument();
  });

  it('displays per-rule count badge', () => {
    render(
      <RuleRow
        rule={baseRule}
        index={0}
        totalRules={1}
        ruleCount={5}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(screen.getByText('5 replacements')).toBeInTheDocument();
  });

  it('displays error message when error is present', () => {
    const error = {
      code: 'invalid_pattern' as const,
      message: 'Invalid regex pattern',
      pattern: '(?P<invalid>)',
      flags: 'g',
    };

    render(
      <RuleRow
        rule={{
          ...baseRule,
          isRegex: true,
        }}
        index={0}
        totalRules={1}
        error={error}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(screen.getByText('Invalid regex')).toBeInTheDocument();
    expect(screen.getByText(/Invalid regex pattern/)).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <RuleRow
        rule={baseRule}
        index={0}
        totalRules={1}
        onUpdate={vi.fn()}
        onDelete={onDelete}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    screen.getByTestId('rule-delete-rule-1').click();
    expect(onDelete).toHaveBeenCalled();
  });

  it('shows enable button with aria-pressed', () => {
    const onUpdate = vi.fn();
    render(
      <RuleRow
        rule={baseRule}
        index={0}
        totalRules={1}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    const enableButton = screen.getByTestId('rule-enable-rule-1');
    expect(enableButton).toHaveAttribute('aria-pressed', 'true');
    enableButton.click();
    expect(onUpdate).toHaveBeenCalledWith({ enabled: false });
  });

  it('does not show moveUp button for first rule', () => {
    render(
      <RuleRow
        rule={baseRule}
        index={0}
        totalRules={2}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(screen.queryByTestId('rule-moveup-rule-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('rule-movedown-rule-1')).toBeInTheDocument();
  });

  it('does not show moveDown button for last rule', () => {
    render(
      <RuleRow
        rule={baseRule}
        index={1}
        totalRules={2}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(screen.getByTestId('rule-moveup-rule-1')).toBeInTheDocument();
    expect(screen.queryByTestId('rule-movedown-rule-1')).not.toBeInTheDocument();
  });
});
