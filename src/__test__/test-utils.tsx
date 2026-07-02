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
    toolsHeading: 'All tools',
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
    bookmarks: {
      link: {
        externalLink: 'External link',
        openInNewTab: 'Open in new tab',
        playVideo: 'Play video',
      },
    },
    ladder: {
      title: 'Ladder Game',
      lead: 'Decide fair orders for your group.',
      setup: {
        countLabel: 'Number of players',
        playerPlaceholder: 'Player name',
        prizePlaceholder: 'Outcome',
        shuffleToggle: 'Shuffle results',
        shuffleHint:
          'Shuffles the outcome positions once more so no one can predict the result in advance',
        build: 'Build ladder',
        autoNames: 'Auto-suggest names',
        reroll: 'Shuffle again',
        clearAll: 'Clear all',
        resultWinner: 'One winner',
        resultRank: 'Ranking',
      },
      defaults: {
        player: 'Player {n}',
        prizeWin: 'Win',
        prizeOther: 'Lose',
      },
      fruits: {
        apple: 'Apple',
        grape: 'Grape',
        orange: 'Orange',
        strawberry: 'Strawberry',
        peach: 'Peach',
        banana: 'Banana',
        watermelon: 'Watermelon',
        kiwi: 'Kiwi',
        cherry: 'Cherry',
        melon: 'Melon',
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
        download: 'Download result',
        downloaded: 'Downloaded',
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
        featuresTitle: 'Handy features',
        featuresBody: 'Turn on',
      },
      useCases: {
        heading: 'When the Ladder Game comes in handy',
        lead: 'From a simple bet to an awkward turn order, one round of the ladder settles it cleanly—no arguments afterward.',
        items: [
          {
            title: 'Coffee & lunch runs',
            body: 'Deciding who buys the coffee or covers lunch today.',
          },
          {
            title: 'Chores & duties',
            body: 'Splitting up the dishes, recycling, or note-taking.',
          },
          {
            title: 'Presentation & game order',
            body: 'Speaking order, karaoke turns, who goes first in a board game.',
          },
          {
            title: 'Making teams or groups',
            body: 'Picking sides or forming groups.',
          },
          {
            title: 'Gift & prize exchanges',
            body: 'Secret Santa, ladder gifts, prize draws.',
          },
        ],
      },
      faq: {
        heading: 'Frequently Asked Questions',
        items: [
          { q: 'Is the ladder game really fair?', a: 'Yes, absolutely.' },
          { q: 'How many players can play?', a: 'You can play with 2 to 10 players.' },
          { q: 'Does starting position matter?', a: 'No.' },
          { q: 'Can I reshuffle the ladder?', a: 'Yes.' },
          { q: 'Can I share the results?', a: 'Of course.' },
          { q: 'Does it work on mobile?', a: 'Yes.' },
          { q: 'Are the names I type saved anywhere?', a: 'No.' },
          { q: 'Can I turn off the sound or animation?', a: 'Yes.' },
          { q: 'Can I share the result as an image?', a: 'Yes.' },
        ],
      },
    },
    'new-word': {
      title: 'New Word Glossary',
      intro: {
        eyebrow: 'TEXT TOOL',
        title: 'New Word Glossary',
        lead: 'Discover trendy MZ slang and modern tech terms with definitions and examples in Korean and English.',
      },
      search: {
        placeholder: 'Search by term, definition, or tag (e.g., god life, vibe coding, AI)',
        resultCount: '{count} results',
        clear: 'Clear',
      },
      topics: {
        all: 'All',
        mz: 'MZ Slang',
        tech: 'Tech Terms',
        favorites: 'Favorites',
        recent: 'Recent',
      },
      langToggle: {
        ko: '한국어',
        en: 'English',
        both: 'Both',
      },
      tone: {
        label: 'Tone',
        positive: 'Positive',
        negative: 'Negative',
        neutral: 'Neutral',
      },
      detail: {
        emptyHint: 'Select a term to see its definition and examples here.',
        definition: 'Definition',
        examples: 'Examples',
        origin: 'Origin',
        related: 'Related Terms',
        copyTerm: 'Copy term',
        copyDefinition: 'Copy definition',
        aliases: 'Aliases',
      },
      toast: {
        copied: 'Copied!',
        favorited: 'Added to favorites',
        unfavorited: 'Removed from favorites',
      },
      empty: {
        noResults: "No terms match '{query}'.",
        favorites: 'Star terms to save them to your favorites.',
        recent: 'Your recently viewed terms will appear here.',
      },
      howTo: {
        title: 'What is New Word?',
        body: 'New Word Glossary brings together trendy language in one place.',
      },
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          { q: 'What are new words / slang?', a: 'New words are newly created terms.' },
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
