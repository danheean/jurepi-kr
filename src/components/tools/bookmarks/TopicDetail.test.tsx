import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__test__/test-utils';
import { TopicDetail } from './TopicDetail';
import type { MergedTopic } from '@/lib/bookmarks/schema';

const mockTopic: MergedTopic = {
  slug: 'egovframe-links',
  ko: {
    title: '전자정부 표준프레임워크',
    description: '공식 포털, GitHub, YouTube 공식 자료',
    sections: [
      {
        heading: '공식 자료',
        links: [
          { url: 'https://example.com', label: 'Official Portal' },
        ],
      },
    ],
  },
  en: {
    title: 'eGovFrame Links',
    description: 'Official portal, GitHub, YouTube',
    sections: [
      {
        heading: 'Official Resources',
        links: [
          { url: 'https://example.com', label: 'Official Portal' },
        ],
      },
    ],
  },
};

describe('TopicDetail — share button integration', () => {
  beforeEach(() => {
    // Mock clipboard for all tests
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        configurable: true,
      });
    }
  });

  it('renders share buttons and copies entity url when copy button clicked (KO)', async () => {
    const onCloseMock = vi.fn();

    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    render(
      <TopicDetail
        topic={mockTopic}
        onClose={onCloseMock}
        locale="ko"
      />
    );

    // Verify title renders
    expect(screen.getByRole('heading', { name: mockTopic.ko.title })).toBeInTheDocument();

    // Verify share buttons are present
    expect(screen.getByTestId('share-button-copy')).toBeInTheDocument();

    // Click copy button and verify it uses the entity URL
    const copyBtn = screen.getByTestId('share-button-copy');
    copyBtn.click();

    const expectedUrl = `https://jurepi.kr/ko/tools/bookmarks/${mockTopic.slug}`;
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith(expectedUrl);
    });
  });

  it('renders share buttons and copies entity url when copy button clicked (EN)', async () => {
    const onCloseMock = vi.fn();

    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    render(
      <TopicDetail
        topic={mockTopic}
        onClose={onCloseMock}
        locale="en"
      />
    );

    // Verify title renders
    expect(screen.getByRole('heading', { name: mockTopic.en.title })).toBeInTheDocument();

    // Click copy button
    const copyBtn = screen.getByTestId('share-button-copy');
    copyBtn.click();

    const expectedUrl = `https://jurepi.kr/en/tools/bookmarks/${mockTopic.slug}`;
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith(expectedUrl);
    });
  });
});

describe('TopicDetail — long-form body', () => {
  it('does not render a body block when the topic has no body', () => {
    render(<TopicDetail topic={mockTopic} onClose={vi.fn()} locale="ko" />);
    expect(screen.queryByTestId('bookmarks-detail-body')).toBeNull();
  });

  it('renders the markdown body when present', () => {
    const topicWithBody: MergedTopic = {
      ...mockTopic,
      ko: { ...mockTopic.ko, body: '## 곡 이야기\n\n상세 소개 문단.' },
    };
    render(<TopicDetail topic={topicWithBody} onClose={vi.fn()} locale="ko" />);
    expect(screen.getByTestId('bookmarks-detail-body')).toBeInTheDocument();
    expect(screen.getByText('곡 이야기')).toBeInTheDocument();
    expect(screen.getByText('상세 소개 문단.')).toBeInTheDocument();
  });
});
