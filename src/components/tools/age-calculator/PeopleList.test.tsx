import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { PeopleList } from './PeopleList';
import type { Person } from '@/lib/age-calculator/schema';
import messages from '@/i18n/messages/ko.json';

const M = messages.tools['age-calculator'].people;

describe('PeopleList', () => {
  const mockPeople: Person[] = [
    { id: '1', name: '홍길동', birthdate: '1990-03-15', calendarType: 'solar', isLeapMonth: false },
    { id: '2', name: '김영희', birthdate: '1995-06-20', calendarType: 'lunar', isLeapMonth: false },
  ];

  const mockOnAdd = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnSelect = vi.fn();

  const renderComponent = (people: Person[] = mockPeople) =>
    render(
      <NextIntlClientProvider locale="ko" messages={messages as any}>
        <PeopleList people={people} onAdd={mockOnAdd} onRemove={mockOnRemove} onSelect={mockOnSelect} />
      </NextIntlClientProvider>
    );

  const openForm = () =>
    fireEvent.click(screen.getAllByRole('button').find((b) => b.textContent?.includes(M.addButton))!);

  const selectAddDate = (container: HTMLElement, date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    fireEvent.change(container.querySelector('#add-year')!, { target: { value: String(y) } });
    fireEvent.change(container.querySelector('#add-month')!, { target: { value: String(m) } });
    fireEvent.change(container.querySelector('#add-day')!, { target: { value: String(d) } });
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders heading, add button and people', () => {
    renderComponent();
    expect(screen.getByText(M.heading)).toBeInTheDocument();
    expect(screen.getByText(M.addButton)).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('김영희')).toBeInTheDocument();
  });

  it('renders the empty state when there are no people', () => {
    renderComponent([]);
    expect(screen.getByText(M.emptyState)).toBeInTheDocument();
  });

  it('marks a lunar person with a 음력 tag', () => {
    renderComponent();
    // 김영희 is lunar → their row contains the lunar tag
    expect(screen.getByText(new RegExp(messages.tools['age-calculator'].recents.lunarTag))).toBeInTheDocument();
  });

  it('calls onSelect when a person is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('홍길동'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockPeople[0]);
  });

  it('calls onRemove when the trash icon is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getAllByLabelText(M.removeButton)[0]);
    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('opens the add form with a name field and date dropdowns', () => {
    const { container } = renderComponent();
    openForm();
    expect(screen.getByLabelText(M.addModal.nameLabel)).toBeInTheDocument();
    expect(container.querySelector('#add-year')).toBeInTheDocument();
    expect(container.querySelector('#add-day')).toBeInTheDocument();
  });

  it('closes the form on cancel', async () => {
    renderComponent();
    openForm();
    expect(screen.getByLabelText(M.addModal.nameLabel)).toBeInTheDocument();
    fireEvent.click(screen.getByText(M.addModal.cancel));
    await waitFor(() =>
      expect(screen.queryByLabelText(M.addModal.nameLabel)).not.toBeInTheDocument()
    );
  });

  it('calls onAdd with name, date and solar calendar type', async () => {
    const { container } = renderComponent();
    openForm();
    await userEvent.type(screen.getByLabelText(M.addModal.nameLabel), '이순신');
    selectAddDate(container, '1988-05-10');
    fireEvent.click(screen.getByText(M.addModal.save));
    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith('이순신', '1988-05-10', 'solar', false);
    });
  });

  it('does not submit without a name', () => {
    const { container } = renderComponent();
    openForm();
    selectAddDate(container, '1988-05-10');
    fireEvent.click(screen.getByText(M.addModal.save));
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('does not submit without a complete date', async () => {
    renderComponent();
    openForm();
    await userEvent.type(screen.getByLabelText(M.addModal.nameLabel), '이순신');
    fireEvent.click(screen.getByText(M.addModal.save));
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('opens pre-filled when prefillNonce changes', () => {
    const { container, rerender } = render(
      <NextIntlClientProvider locale="ko" messages={messages as any}>
        <PeopleList
          people={[]}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
          onSelect={mockOnSelect}
          prefill={{ date: '1970-08-15', calendarType: 'lunar', isLeapMonth: false }}
          prefillNonce={1}
        />
      </NextIntlClientProvider>
    );
    // form opened + date dropdowns reflect the prefill
    expect(container.querySelector('#add-year')).toBeInTheDocument();
    expect((container.querySelector('#add-year') as HTMLSelectElement).value).toBe('1970');
  });
});
