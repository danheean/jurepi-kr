import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';

const defaultMessages = {
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
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    themeToggleAria: 'Toggle theme',
    localeAria: 'Select language',
    homeLink: 'Home',
  },
  footer: {
    copyright: '© 2026 Jurepi · All tools are free.',
    tagline: 'Handy tools, all free.',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    consentReopen: 'Privacy settings',
  },
  home: {
    eyebrow: 'Free online tools',
    headline: 'Handy tools, all free.',
    subhead: 'Discover useful tools in one place.',
    searchPlaceholder: 'Search tools…',
    searchAria: 'Search tools',
    mascotGreeting: 'Find the tool you need!',
    resultCount: '{count, plural, one {# tool} other {# tools}}',
  },
  categories: {
    all: 'All',
    random: 'Random',
    calculator: 'Calculator',
    text: 'Text',
    converter: 'Converter',
    fun: 'Fun',
  },
  card: {
    new: 'New',
    popular: 'Popular',
    comingSoon: 'Coming soon',
  },
  emptyState: {
    heading: 'No results found',
    body: 'Try a different search or category.',
    resetButton: 'Reset',
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

function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={defaultMessages as any}>
      {children}
    </NextIntlClientProvider>
  );
}

const customRender = (
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render, userEvent };
