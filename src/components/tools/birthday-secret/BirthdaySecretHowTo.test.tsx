import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { BirthdaySecretHowTo } from './BirthdaySecretHowTo';

function withLocale(node: React.ReactElement, locale: 'ko' | 'en') {
  const messages = locale === 'ko' ? koMessages : enMessages;
  return render(<NextIntlClientProvider locale={locale} messages={messages as any}>{node}</NextIntlClientProvider>);
}

describe('BirthdaySecretHowTo', () => {
  it('renders the section heading and lead', () => {
    withLocale(<BirthdaySecretHowTo />, 'ko');
    expect(screen.getByRole('heading', { level: 2, name: '나의 탄생 비밀 사용 방법' })).toBeInTheDocument();
  });

  it('renders every step from the catalog with its own heading', () => {
    withLocale(<BirthdaySecretHowTo />, 'ko');
    expect(screen.getByRole('heading', { level: 3, name: '생일 입력' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '탄생 프로필 확인' })).toBeInTheDocument();
  });

  it('renders English content with no Korean leakage', () => {
    withLocale(<BirthdaySecretHowTo />, 'en');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('How to use Birthday Secrets');
    const { container } = withLocale(<BirthdaySecretHowTo />, 'en');
    expect(container.textContent).not.toMatch(/[가-힣]/);
  });
});
