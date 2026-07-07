import React from 'react';
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Polyfill ImageData for jsdom (needed for canvas/image processing tests)
if (typeof global.ImageData === 'undefined') {
  // @ts-ignore - polyfill for jsdom
  global.ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    colorSpace = 'srgb';

    constructor(data: Uint8ClampedArray | number, width: number, height?: number) {
      if (typeof data === 'number') {
        this.width = width;
        this.height = height || width;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        this.data = data;
        this.width = width;
        this.height = height || (data.length / (width * 4));
      }
    }
  };
}

// Polyfill URL.createObjectURL / revokeObjectURL for jsdom (blob downloads)
if (typeof URL.createObjectURL === 'undefined') {
  // @ts-ignore - polyfill for jsdom
  URL.createObjectURL = vi.fn(() => 'blob:jsdom-mock');
  // @ts-ignore - polyfill for jsdom
  URL.revokeObjectURL = vi.fn();
}

afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/ko',
  useSearchParams: () => new URLSearchParams(),
}));

// Default English messages for tests
const testMessages = {
  navigation: {
    home: 'Home',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
  },
  header: {
    wordmark: 'Jurepi',
    searchPlaceholder: 'Search tools…',
  },
  footer: {
    copyright: '© 2026 Jurepi · All tools are free.',
    tagline: 'Handy tools, all free.',
  },
  home: {
    eyebrow: 'Free online tools',
    headline: 'Handy tools, all free.',
    subhead: 'Discover useful tools in one place.',
    searchPlaceholder: 'Search tools…',
  },
  notFound: {
    heading: 'Page not found',
    description: 'The page you requested does not exist.',
    backHome: 'Back to home',
  },
  tools: {
    ladder: {
      title: 'Ladder Game',
      lead: 'Decide fair orders for your group.',
      setup: {
        countLabel: 'Number of players',
        playerPlaceholder: 'Player name',
        prizePlaceholder: 'Outcome',
        hideToggle: 'Hide results',
        build: 'Build ladder',
      },
      defaults: {
        player: 'Player {n}',
        prizeWin: 'Win',
        prizeOther: 'Lose',
      },
      header: {
        revealAria: 'Reveal {name}',
      },
      board: {
        aria: 'Ladder game board',
      },
      panel: {
        revealAll: 'Reveal all',
        reshuffle: 'Reshuffle',
        reset: 'Reset',
        copy: 'Copy results',
        copied: 'Copied',
        soundOn: 'Sound on',
        soundOff: 'Sound off',
        summaryTitle: 'Results',
      },
      announce: {
        result: "{name}'s result is {prize}",
      },
      howTo: {
        heading: 'How to play',
        whatIsTitle: 'What is the Ladder Game?',
        whatIsBody: 'The Ladder Game is a classic method for fairly deciding outcomes.',
        howToTitle: 'How to play',
        howToBody: 'Start by selecting the number of players.',
      },
      faq: {
        heading: 'Frequently Asked Questions',
        items: [
          { q: 'Is the ladder game really fair?', a: 'Yes, absolutely.' },
          { q: 'How many players can play?', a: 'You can play with 2 to 10 players.' },
        ],
      },
    },
  },
};

// Don't mock next-intl - let it use actual implementation with test provider

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
