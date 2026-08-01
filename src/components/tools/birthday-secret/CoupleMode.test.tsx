import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/__test__/test-utils';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { buildCoupleView } from '@/lib/birthday-secret/couple';
import type { BirthProfile } from '@/lib/birthday-secret/schema';
import { CoupleMode } from './CoupleMode';

function withLocale(node: React.ReactElement) {
  return render(<NextIntlClientProvider locale="ko" messages={koMessages as any}>{node}</NextIntlClientProvider>);
}

function makeProfile(date: string, month: number, name: string, hex: string): BirthProfile {
  return {
    date,
    month,
    flower: { key: date, ko: { name: `${name}꽃`, meaning: '의미' }, en: { name, meaning: 'meaning' }, googleQuery: { ko: 'q', en: 'q' } },
    stone: { month, ko: { name: '보석', meaning: '뜻', color: '색', hardness: '7', origin: '산지' }, en: { name: 'Stone', meaning: 'meaning', color: 'color', hardness: '7', origin: 'origin' }, googleQuery: { ko: 'q', en: 'q' } },
    color: { key: date, hex, ko: { name: '색상', keyword: '느낌' }, en: { name: 'Color', keyword: 'feel' } },
  };
}

const myProfile = makeProfile('04-15', 4, '펜오키드', '#d1a24e');
const partnerProfile = makeProfile('09-09', 9, '갓개매취', '#a3e768');

describe('CoupleMode', () => {
  it('renders the partner date input', () => {
    withLocale(
      <CoupleMode myProfile={null} partnerKey={null} onSelectPartner={vi.fn()} coupleView={null} />
    );
    expect(screen.getByLabelText('태어난 월')).toBeInTheDocument();
    expect(screen.getByLabelText('태어난 일')).toBeInTheDocument();
  });

  it('does not render the comparison until coupleView is available', () => {
    withLocale(
      <CoupleMode myProfile={myProfile} partnerKey={null} onSelectPartner={vi.fn()} coupleView={null} />
    );
    expect(screen.queryByText('두 사람의 색')).not.toBeInTheDocument();
  });

  it('renders both compact profile cards once coupleView is available', () => {
    const coupleView = buildCoupleView(myProfile, partnerProfile);
    withLocale(
      <CoupleMode myProfile={myProfile} partnerKey="09-09" onSelectPartner={vi.fn()} coupleView={coupleView} />
    );
    expect(screen.getByText('펜오키드꽃')).toBeInTheDocument();
    expect(screen.getByText('갓개매취꽃')).toBeInTheDocument();
  });

  it('renders the combined color palette and same/different-month note', () => {
    const coupleView = buildCoupleView(myProfile, partnerProfile);
    const { container } = withLocale(
      <CoupleMode myProfile={myProfile} partnerKey="09-09" onSelectPartner={vi.fn()} coupleView={coupleView} />
    );
    expect(screen.getByText('두 사람의 색')).toBeInTheDocument();
    expect(container.querySelectorAll('span[aria-hidden="true"]').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('서로 다른 계절의 매력을 지녔어요.')).toBeInTheDocument();
  });

  it('shows the same-month note when both birthdays fall in the same month', () => {
    const sameMonthPartner = makeProfile('04-02', 4, '금작화', '#ffaa00');
    const coupleView = buildCoupleView(myProfile, sameMonthPartner);
    withLocale(
      <CoupleMode myProfile={myProfile} partnerKey="04-02" onSelectPartner={vi.fn()} coupleView={coupleView} />
    );
    expect(screen.getByText('같은 달에 태어난 인연이에요!')).toBeInTheDocument();
  });

  it('fires onSelectPartner with the chosen month/day', () => {
    const onSelectPartner = vi.fn();
    withLocale(
      <CoupleMode myProfile={null} partnerKey={null} onSelectPartner={onSelectPartner} coupleView={null} />
    );
    fireEvent.change(screen.getByLabelText('태어난 월'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('태어난 일'), { target: { value: '9' } });
    expect(onSelectPartner).toHaveBeenCalledWith(9, 9);
  });
});
