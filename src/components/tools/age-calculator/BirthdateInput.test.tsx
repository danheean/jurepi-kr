import { describe, it, expect, vi } from 'vitest';
import { render as customRender, screen, fireEvent } from '@/__test__/test-utils';
import { BirthdateInput } from './BirthdateInput';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/i18n/messages/ko.json';

const allMessages = { ...messages };

function renderWithI18n(component: React.ReactElement) {
  return customRender(
    <NextIntlClientProvider locale="ko" messages={allMessages as any}>
      {component}
    </NextIntlClientProvider>
  );
}

function makeProps(overrides: Partial<React.ComponentProps<typeof BirthdateInput>> = {}) {
  return {
    value: null,
    calendarType: 'solar',
    isLeapMonth: false,
    asOfDate: '',
    useAsOf: false,
    error: null,
    onBirthdateChange: vi.fn(),
    onAsOfDateChange: vi.fn(),
    onUseAsOfChange: vi.fn(),
    onClearError: vi.fn(),
    ...overrides,
  } as React.ComponentProps<typeof BirthdateInput>;
}

describe('BirthdateInput', () => {
  it('renders the solar/lunar toggle and year/month/day dropdowns', () => {
    const { container } = renderWithI18n(<BirthdateInput {...makeProps()} />);
    expect(screen.getByText('생년월일')).toBeInTheDocument();
    expect(screen.getByText('양력')).toBeInTheDocument();
    expect(screen.getByText('음력')).toBeInTheDocument();
    expect(container.querySelector('#birthdate-year')).toBeInTheDocument();
    expect(container.querySelector('#birthdate-day')).toBeInTheDocument();
  });

  it('emits the full value once all date parts are chosen', () => {
    const props = makeProps({ value: '2000-03-01' });
    const { container } = renderWithI18n(<BirthdateInput {...props} />);
    fireEvent.change(container.querySelector('#birthdate-day')!, { target: { value: '15' } });
    expect(props.onBirthdateChange).toHaveBeenCalledWith({
      date: '2000-03-15',
      calendarType: 'solar',
      isLeapMonth: false,
    });
  });

  it('switches to the lunar calendar type', () => {
    const props = makeProps({ value: '2000-03-15' });
    renderWithI18n(<BirthdateInput {...props} />);
    fireEvent.click(screen.getByText('음력'));
    expect(props.onBirthdateChange).toHaveBeenCalledWith(
      expect.objectContaining({ calendarType: 'lunar' })
    );
  });

  it('shows the leap-month switch only for lunar dates', () => {
    const { rerender } = renderWithI18n(<BirthdateInput {...makeProps()} />);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    rerender(
      <NextIntlClientProvider locale="ko" messages={allMessages as any}>
        <BirthdateInput {...makeProps({ calendarType: 'lunar' })} />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('clears the error when the date changes', () => {
    const props = makeProps({ value: '2000-03-01', error: 'future' });
    const { container } = renderWithI18n(<BirthdateInput {...props} />);
    fireEvent.change(container.querySelector('#birthdate-day')!, { target: { value: '15' } });
    expect(props.onClearError).toHaveBeenCalled();
  });

  it('displays the no-leap error', () => {
    renderWithI18n(<BirthdateInput {...makeProps({ calendarType: 'lunar', error: 'no-leap' })} />);
    expect(screen.getByText('해당 연도에 윤달이 없습니다')).toBeInTheDocument();
  });

  it('displays the too-old error', () => {
    renderWithI18n(<BirthdateInput {...makeProps({ error: 'too-old' })} />);
    expect(screen.getByText('150년 이상 전 날짜는 입력할 수 없습니다')).toBeInTheDocument();
  });

  it('toggles the as-of section and shows its dropdowns', () => {
    const props = makeProps();
    const { rerender, container } = renderWithI18n(<BirthdateInput {...props} />);
    fireEvent.click(screen.getByLabelText('기준일 설정'));
    expect(props.onUseAsOfChange).toHaveBeenCalledWith(true);
    rerender(
      <NextIntlClientProvider locale="ko" messages={allMessages as any}>
        <BirthdateInput {...makeProps({ asOfDate: '2025-01-01', useAsOf: true })} />
      </NextIntlClientProvider>
    );
    expect(container.querySelector('#as-of-year')).toBeInTheDocument();
  });

  it('calls onAsOfDateChange when an as-of dropdown changes', () => {
    const props = makeProps({ asOfDate: '2025-01-01', useAsOf: true });
    const { container } = renderWithI18n(<BirthdateInput {...props} />);
    fireEvent.change(container.querySelector('#as-of-day')!, { target: { value: '31' } });
    expect(props.onAsOfDateChange).toHaveBeenCalledWith('2025-01-31');
  });
});
