import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/__test__/test-utils';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { BirthdaySecret } from './BirthdaySecret';

function renderTool() {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages as any}>
      <BirthdaySecret />
    </NextIntlClientProvider>
  );
}

async function selectBirthday(month: string, day: string) {
  fireEvent.change(screen.getByLabelText('태어난 월'), { target: { value: month } });
  fireEvent.change(screen.getByLabelText('태어난 일'), { target: { value: day } });
  // Selecting a date triggers a dynamic catalog import; wait for the profile to resolve.
  await waitFor(() => expect(screen.queryByText('월과 일을 입력하면 나의 탄생 비밀이 나타나요.')).not.toBeInTheDocument());
}

describe('BirthdaySecret (orchestrator)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the empty-state prompt before a birthday is chosen', () => {
    renderTool();
    expect(screen.getByText('월과 일을 입력하면 나의 탄생 비밀이 나타나요.')).toBeInTheDocument();
  });

  it('reveals the profile card once a birthday is selected', async () => {
    renderTool();
    await selectBirthday('4', '15');
    expect(screen.getByRole('region', { name: '4월 15일' })).toBeInTheDocument();
  });

  it('composes the today card below the input, always present', async () => {
    renderTool();
    await waitFor(() => expect(screen.getByRole('heading', { name: '오늘의 탄생' })).toBeInTheDocument());
  });

  it('does not show recent lookups until at least one birthday has been viewed', () => {
    renderTool();
    expect(screen.queryByRole('heading', { name: '최근 본 생일' })).not.toBeInTheDocument();
  });

  it('shows recent lookups after a selection, and restores a prior date on click', async () => {
    renderTool();
    await selectBirthday('4', '15');
    await selectBirthday('12', '25');

    await waitFor(() => expect(screen.getByRole('heading', { name: '최근 본 생일' })).toBeInTheDocument());
    const recentsRegion = screen.getByRole('region', { name: '최근 본 생일' });
    expect(recentsRegion.querySelector('button')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '4월 15일' }));
    await waitFor(() => expect(screen.getByRole('region', { name: '4월 15일' })).toBeInTheDocument());
  });

  it('clears recent lookups when the clear-history button is pressed', async () => {
    renderTool();
    await selectBirthday('4', '15');
    await waitFor(() => expect(screen.getByRole('heading', { name: '최근 본 생일' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '기록 지우기' }));

    await waitFor(() => expect(screen.queryByRole('heading', { name: '최근 본 생일' })).not.toBeInTheDocument());
  });

  it('toggles couple mode on and off', async () => {
    renderTool();
    expect(screen.queryByLabelText('상대')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '커플 궁합 보기' }));
    expect(screen.getByRole('button', { name: '혼자 보기' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '혼자 보기' }));
    expect(screen.getByRole('button', { name: '커플 궁합 보기' })).toBeInTheDocument();
  });
});
