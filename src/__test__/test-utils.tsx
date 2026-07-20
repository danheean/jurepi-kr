import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
// Use the REAL en catalog for find-replace so component tests validate against
// the shipping strings (not a hand-authored mock that can silently drift).
import enMessages from '@/i18n/messages/en.json';

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
  toolPage: {
    back: 'Back',
    loading: 'Loading tool…',
    errorTitle: 'Something went wrong',
    errorBody: 'The tool encountered an error. Please try refreshing the page.',
    errorAction: 'Refresh',
    characterAlt: 'Jurepi character',
  },
  home: {
    eyebrow: 'Free online tools',
    headline: 'Everyday tools, all in one place.',
    subhead: 'No install, no signup — all free, ready to use.',
    searchPlaceholder: 'Search tools…',
    searchAria: 'Search tools',
    toolsHeading: 'All tools',
    mascotGreeting: 'Find the tool you need!',
    mascotAlt: 'Jurepi mascot',
    mascotBlogLabel: 'Jurepi blog',
    resultCount: '{count, plural, one {# tool} other {# tools}}',
    requestButton: 'Request a tool',
    requestSubject: '[Jurepi] Tool request',
    favorites: {
      filterLabel: 'Favorites',
      filterAria: 'Filter by favorites',
      addAria: 'Add {name} to favorites',
      removeAria: 'Remove {name} from favorites',
      emptyHeading: 'No favorites yet',
      emptyBody: 'Tap the heart on a card to add favorites.',
      showAll: 'Show all tools',
    },
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
  share: {
    heading: 'Share',
    targets: {
      naver: 'Share on Naver (Blog·Cafe)',
      x: 'Share on X (Twitter)',
      facebook: 'Share on Facebook',
      threads: 'Share on Threads',
      telegram: 'Share on Telegram',
      whatsapp: 'Share on WhatsApp',
    },
    copyLink: 'Copy link',
    copied: 'Link copied!',
    native: 'Share via another app (Instagram, KakaoTalk, …)',
  },
  markdownCopy: {
    copy: 'Copy as Markdown',
    copied: 'Markdown copied!',
    sourceLabel: 'Source',
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
      detail: {
        close: 'Close',
      },
    },
    rankings: {
      detail: {
        selectHint: 'Select a ranking to view',
        closeAria: 'Close detail',
      },
      fields: {
        tech: 'Technology',
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
        result: '{name} is the winner',
      },
      legend: {
        title: 'Options Legend',
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
        noResults: "No terms match “{query}”.",
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
    'json-formatter': {
      title: 'JSON Formatter & Validator',
      description: 'Format, validate, and analyze JSON with ease',
      meta: {
        title: 'JSON Formatter & Validator — Jurepi',
        description: 'Prettify minified JSON, validate syntax, and find errors with precise line and column numbers.',
      },
      urlLoader: {
        label: 'Load from URL',
        placeholder: 'https://api.example.com/data.json',
        loadButton: 'Load',
        loading: 'Loading…',
        errors: {
          invalid_url: 'Please enter a valid http(s) URL',
          cors_or_network: 'The server does not allow cross-origin access (CORS) or there is a network error. Please download the file and paste it instead.',
          http_error: 'Server returned status {status}',
          too_large: 'File is too large to process (max 10MB)',
          empty_body: 'Response body is empty',
        },
      },
      input: {
        placeholder: 'Paste JSON here…',
        label: 'JSON Input',
      },
      options: {
        indent: 'Indentation',
        spaces2: '2 spaces',
        spaces4: '4 spaces',
        tab: 'Tab',
        sortKeys: 'Sort keys',
        statusValid: 'Valid',
        statusInvalid: 'Error',
      },
      output: {
        label: 'Output',
        formatTab: 'Formatted',
        treeTab: 'Tree',
        copy: 'Copy',
        copySuccess: 'Copied!',
        download: 'Download',
        downloadFilename: 'data.json',
      },
      actions: {
        format: 'Format',
        minify: 'Minify',
        clear: 'Clear',
      },
      errors: {
        title: 'Error',
        line: 'Line',
        column: 'Column',
        parseError: "Line {line}, column {column}: Unexpected token ''{token}''",
      },
      stats: {
        size: 'Size',
        elements: 'Elements',
        depth: 'Depth',
        display: '{size} · {elements} items · depth {depth}',
      },
      shortcuts: {
        format: 'Ctrl+Enter',
        minify: 'Ctrl+Shift+M',
        copy: 'Ctrl+C',
      },
      intro: {
        eyebrow: 'Developer Tool',
        title: 'JSON Formatter & Validator',
        lead: 'Prettify minified JSON, validate syntax, and find errors with precise line and column numbers.',
      },
      howTo: {
        title: 'How to Use',
        items: [
          { title: 'Step 1: Paste', description: 'Paste JSON into the input area.' },
          { title: 'Step 2: Configure', description: 'Choose indentation style and whether to sort keys.' },
          { title: 'Step 3: Download', description: 'Copy the formatted JSON or download it as a file.' },
        ],
      },
      faq: {
        items: [
          { q: 'What is JSON?', a: "JSON (JavaScript Object Notation) is a text format for structured data. It's widely used in web APIs and configuration files." },
          { q: 'Why format JSON?', a: 'Formatted JSON is easier to read, debug, and compare in version control.' },
          { q: 'Is my data private?', a: 'Yes, all processing happens in your browser. Your JSON never leaves your device.' },
          { q: 'Can I load from a URL?', a: 'Yes, paste the URL of a public JSON API or .json file. The server must allow CORS.' },
        ],
      },
    },
    'transparent-background': {
      title: 'Transparent Background Maker',
      description: 'Remove solid-color backgrounds locally. No upload.',
      lead: 'Make backgrounds transparent',
      meta: {
        title: 'Transparent Background Maker · Jurepi',
        description: 'Remove solid-color backgrounds from product shots, logos, and scans instantly. 100% local. Your image stays on your device.',
      },
      intro: {
        eyebrow: 'Converter Tool',
        title: 'Transparent Background Maker',
        lead: 'Remove solid backgrounds instantly. 100% local. Your image stays on your device.',
      },
      upload: {
        label: 'Upload Image',
        text: 'Click to upload or drag your image',
        button: 'Choose file',
        formats: 'PNG, JPEG, WebP',
        fileName: 'Filename',
        fileSize: 'File size',
        dragActive: 'Drop your file here',
      },
      colorPicker: {
        label: 'Background Color',
        autoDetect: 'Auto-Detect',
        eyedropper: 'Pick Color',
        hexInput: 'Color Code (#RRGGBB)',
        currentColor: 'Selected Color',
        eyedropperMode: 'Enable eyedropper mode',
        eyedropperActive: 'Tap or click the image to pick a color',
        eyedropperCancel: 'Cancel',
        hexPlaceholder: '#ffffff',
      },
      controls: {
        toleranceLabel: 'Tolerance',
        toleranceHelp: 'How similar colors to remove (0=exact color only, 100=very similar)',
        toleranceValue: 'Tolerance: {value}%',
        featherLabel: 'Feather',
        featherHelp: 'Edge smoothness (0=sharp, 20=soft)',
        featherValue: 'Feather: {value}px',
        modeLabel: 'Removal Mode',
        modeFloodFill: 'Connected areas only',
        modeFloodFillHelp: 'Remove only areas connected to the background (preserves same colors inside objects)',
        modeGlobal: 'All matching',
        modeGlobalHelp: 'Remove all pixels matching the background color',
        clearAll: 'Start Over',
      },
      preview: {
        label: 'Preview',
        detecting: 'Detecting background color…',
        empty: 'Upload an image to see the preview',
        dimensions: 'Original: {width}×{height} → Export as transparent PNG',
        downscaled: 'Image is large, so the longest edge has been downscaled to 4096px',
        resultAlt: 'Preview of the result image with the background removed',
      },
      export: {
        download: 'Download PNG',
        copy: 'Copy to Clipboard',
        downloadDisabled: 'Upload and configure an image to download',
        downloadSuccess: 'Downloaded!',
        copySuccess: 'Copied to clipboard!',
        downloadFail: 'Download failed. Try again',
        copyFail: 'Copy failed. Your browser may not support copying images to the clipboard',
        fileName: 'transparent-{timestamp}.png',
      },
      errors: {
        unsupportedFormat: 'PNG, JPEG, WebP formats only',
        cornerDetectFail: 'Failed to detect background. Using white as default',
        processingTimeout: 'Processing timed out. Try a smaller image',
        fileTooBig: 'File is too large',
        invalidImage: 'Invalid image file',
        processingFailed: 'Processing failed. Please try again',
      },
      howTo: {
        title: 'How to Remove Backgrounds',
        s1: 'Upload Your Image',
        s1Body: 'Upload a PNG, JPEG, or WebP image with a solid-color background.',
        s2: 'Select Background Color',
        s2Body: 'Click Auto-Detect or use the eyedropper to select the background color.',
        s3: 'Adjust Tolerance',
        s3Body: 'Use the slider to control how similar colors are removed. Lower = stricter match, Higher = more forgiving.',
        s4: 'Choose Feather',
        s4Body: 'Set edge smoothness from 0–20px for an anti-alias effect.',
        s5: 'Pick Removal Mode',
        s5Body: 'Choose between Connected Areas Only (preserves same colors inside objects) or All Matching (removes all matching pixels).',
        s6: 'Download',
        s6Body: 'Download the transparent PNG or copy to your clipboard.',
        whenToUse: 'Best for solid-color backgrounds: product photos, logos, scans, screenshots. For complex photos or portraits, consider AI-powered tools.',
      },
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          {
            q: 'Is my image uploaded?',
            a: 'No. All processing happens locally in your browser. Your image is never uploaded.',
          },
          {
            q: 'How big is the resulting PNG?',
            a: 'Depends on the original. Downscaled images (>4096px) are much smaller.',
          },
          {
            q: 'What is the difference between Connected vs All Matching?',
            a: 'Connected: removes only areas touching the background (preserves same colors inside objects). All Matching: removes all pixels matching the background color.',
          },
          {
            q: 'What does Feather do?',
            a: 'Feather softens the edge by blending alpha. Larger values create a smoother, anti-aliased border.',
          },
          {
            q: 'What if my image is already transparent?',
            a: 'Existing transparency is preserved. New removal effects are multiplied with it.',
          },
          {
            q: 'Is there a maximum image size?',
            a: 'No limit. Images larger than 4096px are automatically downscaled for performance.',
          },
        ],
      },
    },
    'base64-encoder': {
      title: 'Base64 Encoder/Decoder',
      description: 'Convert text and files to/from Base64 with UTF-8 integrity.',
      mode: {
        label: 'Mode',
        text: 'Text',
        file: 'File',
      },
      variant: {
        label: 'Variant',
        standard: 'Standard',
        standardHint: 'A-Za-z0-9+/',
        urlSafe: 'URL-Safe',
        urlSafeHint: 'A-Za-z0-9-_',
      },
      direction: {
        label: 'Direction',
        encode: 'Encode →',
        decode: '← Decode',
      },
      input: {
        label: 'Input',
        fileSelect: 'Select file',
        textPlaceholder: 'Paste text or Base64…',
        fileLabel: 'Drag an image, PDF, font, or other file — or click to browse',
        fileSuccess: 'File selected: {filename} ({size})',
      },
      process: {
        button: 'Convert',
        loading: 'Processing…',
      },
      output: {
        label: 'Output',
        placeholder: 'Output will appear here',
        copyBase64: 'Copy Base64',
        copyDataUri: 'Copy Data-URI',
        copyText: 'Copy Text',
        download: 'Download',
        copied: 'Copied!',
        imageAlt: 'Decoded image',
        downloadImage: 'Download image',
        copyImage: 'Copy image',
        fileReady: 'Decoded file',
        downloadFile: 'Download file',
      },
      meta: {
        title: 'Base64 Encoder/Decoder — Text & File Conversion',
        description: 'Safely convert text and files to/from Base64 with UTF-8 integrity.',
      },
      errors: {
        invalidBase64: 'Invalid Base64 format.',
        emptyInput: 'Enter text or file.',
        fileTooLarge: 'File exceeds 5MB limit.',
        notUtf8: 'Unable to decode as UTF-8.',
        fileReadError: 'Failed to read the file.',
      },
      faq: {
        heading: 'Frequently Asked Questions',
        items: [
          { q: 'What is Base64?', a: 'Base64 is a binary-to-text encoding scheme.' },
          { q: 'What is URL-safe Base64?', a: 'URL-safe Base64 uses - and _ instead of + and /.' },
          { q: 'Is my data uploaded?', a: 'No, all processing is local.' },
          { q: 'What is the file size limit?', a: 'Maximum 5MB.' },
          {
            q: 'When is Base64 typically used?',
            a: 'Common uses include data URIs, email attachments, certificates, and carrying binaries in JSON.',
          },
        ],
      },
    },
    roulette: {
      title: 'Decision Roulette',
      description: 'Spin to decide fairly from your options.',
      intro: {
        eyebrow: 'Random Tool',
        headline: 'Decision Roulette',
        lead: 'Spin to decide fairly from your options.',
      },
      options: {
        label: 'Add Option',
        add: 'Add',
        placeholder: 'e.g., Pizza, Pasta, Salad (commas add several)',
        weight: 'Weight',
        delete: 'Delete',
        reorderUp: 'Move up',
        reorderDown: 'Move down',
        empty: 'Please add at least one option.',
        tooMany: 'Maximum 30 options allowed.',
        duplicate: 'This option already exists.',
      },
      spin: {
        button: 'Spin Now!',
        disabled: 'You need at least 2 options',
        spinning: 'Spinning…',
      },
      result: {
        eyebrow: 'Congratulations!',
        spinAgain: 'Spin Again',
        removeAndSpin: 'Remove & Re-spin',
      },
      announce: {
        result: '{name} is the winner',
      },
      legend: {
        title: 'Options Legend',
      },
      toasts: {
        saved: 'Set saved successfully',
        loaded: 'Set loaded',
        deleted: 'Set deleted',
        emptyLabel: 'Please enter an option label',
        bulkAdded: '{count} options added',
        duplicateLabel: 'This option already exists',
        maxOptions: 'Maximum 30 options reached',
      },
      save: {
        label: 'Save This Set',
        button: 'Save',
        input: 'Set name (max 50 characters)',
        placeholder: 'Set name',
        default: 'Untitled',
      },
      load: {
        label: 'Saved Sets',
        empty: 'Save a set to see it here',
        itemCount: '{count} options',
        delete: 'Delete',
      },
      settings: {
        title: 'Settings',
        sound: 'Sound',
        volume: 'Volume',
        removeWinner: 'Remove Winner Mode',
      },
      howTo: {
        heading: 'How to Use the Roulette',
        step1Title: 'Add Options',
        step1Body: 'Enter your options in the input field.',
        step2Title: 'Adjust Weights',
        step2Body: 'Optional: set weights to change probabilities.',
        step3Title: 'Spin',
        step3Body: 'Click the Spin Now button to reveal the winner.',
        tipsTitle: 'Tips',
        tipsBody: 'Save sets for quick reuse. Use Remove Winner Mode for sequential selections.',
      },
      faq: {
        items: [
          {
            q: 'Is the roulette truly fair?',
            a: 'Yes, it uses cryptographic random number generation.',
          },
          {
            q: 'How many options can I add?',
            a: 'Between 2 and 30 options.',
          },
          {
            q: 'Where are my sets stored?',
            a: 'In your browser local storage, never sent anywhere.',
          },
        ],
      },
    },
    'character-counter': {
      title: 'Character & Word Counter',
      description: 'Count characters, words, sentences in real-time.',
      intro: {
        eyebrow: 'TEXT TOOL',
        heading: 'Character & Word Counter',
        lead: 'Count characters, words, sentences in real-time.',
      },
      textarea: {
        placeholder: 'Paste or type text here…',
        ariaLabel: 'Text input',
      },
      hint: '{chars} characters ({noSpace} without spaces)',
      metrics: {
        label: {
          charactersWithSpaces: 'Characters (with spaces)',
          charactersWithoutSpaces: 'Characters (no spaces)',
          words: 'Words',
          sentences: 'Sentences',
          paragraphs: 'Paragraphs',
          lines: 'Lines',
          byteSize: 'Bytes (UTF-8)',
          readingTime: 'Reading time',
          speakingTime: 'Speaking time',
        },
        unit: {
          minutes: 'min',
        },
      },
      limit: {
        label: 'Character Limit',
        preset: {
          twitter: 'Twitter (280)',
          meta: 'Meta Description (160)',
          custom: 'Custom',
          none: 'None',
        },
        customInput: {
          ariaLabel: 'Custom character limit input',
          placeholder: 'e.g., 500',
        },
        progress: {
          ariaLabel: 'Character count progress',
          status: {
            under: '{current} / {limit} (OK)',
            near: '{current} / {limit} (80%)',
            over: '{current} / {limit} (OVER)',
          },
        },
      },
      button: {
        copyText: 'Copy text',
        copyStats: 'Copy stats',
        clear: 'Clear',
      },
      toast: {
        copiedText: 'Copied!',
        copiedStats: 'Stats copied!',
        cleared: 'Cleared!',
      },
      howTo: {
        title: 'How to Use',
        steps: [
          { step: 1, text: 'Paste or type text into the input field.' },
          { step: 2, text: 'All metrics update in real-time as you type.' },
          { step: 3, text: 'Optionally select a character limit (Twitter, Meta, custom).' },
          { step: 4, text: 'Copy the text or metrics for use elsewhere.' },
        ],
      },
      faq: {
        title: 'FAQ',
        items: [
          {
            q: 'Why do character counts with and without spaces differ?',
            a: 'Spaces include tabs, line breaks, etc. Most apps set limits by character count including spaces.',
          },
          {
            q: 'How are emoji counted?',
            a: 'Emoji and ZWJ sequences count as 1 character each (via Intl.Segmenter).',
          },
          {
            q: 'How is reading time calculated?',
            a: 'We divide word count by your reading speed (default 200 WPM).',
          },
          {
            q: 'How is speaking time calculated?',
            a: 'We divide word count by your speaking speed (default 130 WPM).',
          },
          {
            q: 'Why do bytes differ from character count?',
            a: 'In UTF-8, Korean characters and emoji take multiple bytes. Byte limits are common in programming.',
          },
        ],
      },
    },
    howto: {
      title: 'How-To Guides',
      description: 'Step-by-step guides — installing Claude Code, issuing API tokens — with images, diagrams, and code.',
      intro: {
        eyebrow: 'DEV TOOL',
        title: 'How-To Guides',
        lead: 'Read practical guides — installing Claude Code, issuing tokens — step by step, with images, diagrams, and code.',
      },
      search: {
        placeholder: 'Search by title, topic, or tag (e.g. Claude Code, token, git)',
        label: 'Search guides',
        resultCount: '{count} results',
        clear: 'Clear',
      },
      tabs: {
        all: 'All',
        favorites: 'Favorites',
        recent: 'Recent',
      },
      topics: {
        setup: 'Setup',
        'ai-tools': 'AI Tools',
        git: 'Git',
        api: 'API',
        cli: 'CLI',
        deploy: 'Deploy',
      },
      difficulty: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
      },
      card: {
        favorite: 'Add to favorites',
        unfavorite: 'Remove from favorites',
        updated: 'Updated {date}',
      },
      empty: {
        noResults: "No guides match '{query}'",
        noFavorites: 'Tap the star to save guides you use often',
        noRecent: "Guides you've read appear here",
      },
      spoke: {
        readingTime: '{minutes} min read',
        updated: 'Updated {date}',
        related: 'Related guides',
        backToHub: 'All guides',
      },
      howto: {
        title: 'How to use How-To Guides',
        items: [
          {
            title: 'Search to find',
            body: 'Search by title, topic, or tag to quickly find the guide you need.',
          },
          {
            title: 'Browse by topic',
            body: 'Click a topic tab (Setup, API, Git, etc.) at the top to see related guides grouped together.',
          },
          {
            title: 'Save favorites',
            body: 'Click the star icon on any guide to save it to your Favorites tab for quick access later.',
          },
        ],
      },
      faq: {
        title: 'Frequently asked questions',
        items: [
          {
            q: 'Where are guides stored?',
            a: "All guides are generated as static HTML and load instantly in your browser. They're not stored on your device — just open this site and read.",
          },
          {
            q: 'Where are my favorites saved?',
            a: "Favorites are saved only in your browser's local storage and never sent anywhere. If you clear your browser data, they're deleted.",
          },
          {
            q: 'Can I copy code?',
            a: "Yes, click the 'Copy' button in the top-right corner of any code block to copy it to your clipboard.",
          },
        ],
      },
      code: {
        copy: 'Copy code',
        copied: 'Copied',
      },
      mermaid: {
        sourceLabel: 'Diagram source',
      },
    },
    'knitting-gauge': {
      title: 'Knitting Gauge Calculator',
      description: 'Calculate cast-on stitches/rows from your gauge and rescale patterns',
      modes: {
        label: 'Calculation modes',
        dimToCounts: 'Dimensions → Stitches/Rows',
        countsToDim: 'Stitches/Rows → Dimensions',
        patternRescale: 'Pattern Rescale',
      },
      fields: {
        stitches: 'Stitches',
        rows: 'Rows',
        swatchWidth: 'Swatch Width',
        swatchHeight: 'Swatch Height',
        needle: 'Needle Size (optional)',
        yarn: 'Yarn Weight (optional)',
        targetWidth: 'Target Width',
        targetLength: 'Target Length',
        width: 'Width',
        length: 'Length',
        stitchCount: 'Stitch Count',
        rowCount: 'Row Count',
        patternGauge: 'Pattern Gauge',
        patternCount: 'Pattern Count',
        yourGauge: 'Your Gauge',
      },
      units: {
        label: 'Unit',
        cm: 'cm',
        inch: 'inch',
      },
      results: {
        castOnStitches: 'Cast-On Stitches',
        rows: 'Rows',
        exact: 'Exact',
        actual: 'Actual Size',
        difference: 'vs Target',
        rescaledCount: 'Count for Your Gauge',
        ratio: 'Ratio',
      },
      actions: {
        copy: 'Copy',
        copied: 'Copied',
        save: 'Save',
        apply: 'Apply',
        delete: 'Delete',
        clear: 'Clear',
      },
      projects: {
        title: 'Saved Gauges',
        placeholder: 'Enter gauge name',
        empty: 'No saved gauges',
        max: 'Up to 50 gauges',
      },
      errors: {
        invalidInput: 'Please enter positive numbers',
        swatchTooSmall: 'Swatch size must be greater than 0',
        storage: 'Storage error',
      },
      howTo: {
        title: 'What is Gauge',
        items: [
          'Knitting gauge shows how many stitches and rows fit within a standard length (usually 10cm).',
          'Once you decide your target size, you can use the gauge to calculate how many stitches to cast on and rows to knit.',
          'If you have a pattern written for a different gauge, you can rescale it to match your own gauge.',
          'This calculator automates all these calculations for you.',
        ],
      },
      faq: {
        title: 'FAQ',
        items: [
          {
            q: 'How do you measure gauge?',
            a: 'Make a small swatch (about 10cm × 10cm or 4in × 4in) with your yarn and needles. Count how many stitches and rows fit inside.',
          },
          {
            q: 'Why is gauge important?',
            a: 'Different gauges produce different finished sizes. Same stitches with thin yarn makes a smaller piece; thick yarn makes a larger piece.',
          },
          {
            q: 'Can I mix cm and inches?',
            a: 'Yes, this calculator automatically converts. Use the unit toggle to switch between cm and inches.',
          },
          {
            q: 'When do saved gauges disappear?',
            a: 'Gauges are saved in your browser storage. They disappear if you clear your browser data or use private browsing mode.',
          },
          {
            q: 'How do I rescale a pattern to my gauge?',
            a: 'Select the "Pattern Rescale" tab. Enter the pattern gauge and stitch count from the pattern, and the calculator will show you what count you need for your gauge.',
          },
        ],
      },
    },
    'unit-converter': {
      title: 'Unit Converter',
      description: 'Convert everyday measurements instantly',
      eyebrow: 'CONVERTER TOOL',
      lead: 'Convert lengths, weights, temperatures, times, and more in real time.',
      categories: {
        length: 'Length',
        mass: 'Weight',
        temperature: 'Temperature',
        area: 'Area',
        volume: 'Volume',
        speed: 'Speed',
        digital_storage: 'Digital Storage',
        time: 'Time',
      },
      conversionInput: {
        label: 'Value',
        placeholder: 'Enter value',
      },
      fromUnit: {
        label: 'From unit',
      },
      toUnit: {
        label: 'To unit',
      },
      buttons: {
        swap: 'Swap units',
        clear: 'Clear history',
      },
      precision: {
        label: 'Decimal places',
        caption: '{count} places',
      },
      recents: {
        heading: 'Recent Conversions',
        empty: 'No conversions yet',
        justNow: 'Just now',
        minutesAgo: '{count}m ago',
        hoursAgo: '{count}h ago',
        daysAgo: '{count}d ago',
      },
      table: {
        heading: 'Conversion Table',
        empty: 'No units in this category',
      },
      errors: {
        invalidNumber: 'Please enter a number',
        negativeNonTemp: 'Negative values only allowed for temperature',
        outOfRange: 'Number out of range',
      },
      picker: { search: 'Search units…', noMatch: 'No units match' },
      units: {
        meter: 'Meter', millimeter: 'Millimeter', centimeter: 'Centimeter', kilometer: 'Kilometer',
        inch: 'Inch', foot: 'Foot', yard: 'Yard', mile: 'Mile',
        kilogram: 'Kilogram', gram: 'Gram', milligram: 'Milligram', ounce: 'Ounce', pound: 'Pound',
        celsius: 'Celsius', fahrenheit: 'Fahrenheit', kelvin: 'Kelvin',
        square_meter: 'Square meter', square_millimeter: 'Square millimeter', square_centimeter: 'Square centimeter',
        square_kilometer: 'Square kilometer', square_inch: 'Square inch', square_foot: 'Square foot',
        square_yard: 'Square yard', square_mile: 'Square mile', pyeong: 'Pyeong',
        liter: 'Liter', milliliter: 'Milliliter', cubic_inch: 'Cubic inch', cubic_foot: 'Cubic foot', gallon: 'Gallon',
        meter_per_second: 'Meters per second', kilometer_per_hour: 'Kilometers per hour', mile_per_hour: 'Miles per hour', knot: 'Knot',
        byte: 'Byte', kilobyte: 'Kilobyte', megabyte: 'Megabyte', gigabyte: 'Gigabyte', terabyte: 'Terabyte',
        kibibyte: 'Kibibyte', mebibyte: 'Mebibyte', gibibyte: 'Gibibyte', tebibyte: 'Tebibyte',
        millisecond: 'Millisecond', second: 'Second', minute: 'Minute', hour: 'Hour', day: 'Day',
      },
    },
    'find-replace': (enMessages as any).tools['find-replace'],
    'jwt-decoder': (enMessages as any).tools['jwt-decoder'],
    'cron-parser': (enMessages as any).tools['cron-parser'],
    'lotto-generator': (enMessages as any).tools['lotto-generator'],
    cheer: (enMessages as any).tools.cheer,
  },
};

export function AllTheProviders({ children, locale = 'en' }: { children: ReactNode; locale?: string }) {
  return (
    <NextIntlClientProvider locale={locale} messages={defaultMessages as any}>
      {children}
    </NextIntlClientProvider>
  );
}

const customRender = (
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'> & { locale?: string }
) => {
  const { locale = 'en', ...renderOptions } = options || {} as any;
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => AllTheProviders({ children, locale }),
    ...renderOptions,
  } as any);
};

export * from '@testing-library/react';
export { customRender as render, userEvent };
