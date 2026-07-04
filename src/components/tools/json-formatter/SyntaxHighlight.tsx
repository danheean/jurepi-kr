'use client';

import { useMemo } from 'react';

interface SyntaxHighlightProps {
  json: string;
  className?: string;
}

type TokenType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'key'
  | 'bracket'
  | 'punctuation'
  | 'whitespace';

interface Token {
  type: TokenType;
  value: string;
}

function tokenizeJson(json: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < json.length) {
    const char = json[i];

    // Whitespace (preserve for formatting)
    if (/\s/.test(char)) {
      let whitespace = '';
      while (i < json.length && /\s/.test(json[i])) {
        whitespace += json[i];
        i++;
      }
      tokens.push({ type: 'whitespace', value: whitespace });
      continue;
    }

    // Brackets and braces
    if (/[{}\[\]]/.test(char)) {
      tokens.push({ type: 'bracket', value: char });
      i++;
      continue;
    }

    // Punctuation (colon, comma)
    if (/[:,]/.test(char)) {
      tokens.push({ type: 'punctuation', value: char });
      i++;
      continue;
    }

    // Strings
    if (char === '"') {
      let str = '"';
      i++;
      while (i < json.length && json[i] !== '"') {
        if (json[i] === '\\') {
          str += json[i] + (json[i + 1] || '');
          i += 2;
        } else {
          str += json[i];
          i++;
        }
      }
      if (i < json.length) {
        str += json[i];
        i++;
      }

      // Check if this is a key (followed by colon after optional whitespace)
      let j = i;
      while (j < json.length && /\s/.test(json[j])) j++;

      if (j < json.length && json[j] === ':') {
        tokens.push({ type: 'key', value: str });
      } else {
        tokens.push({ type: 'string', value: str });
      }
      continue;
    }

    // Numbers
    if (/[-\d]/.test(char)) {
      let num = '';
      while (i < json.length && /[\d.\-+eE]/.test(json[i])) {
        num += json[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Booleans and null
    if (json.slice(i, i + 4) === 'true') {
      tokens.push({ type: 'boolean', value: 'true' });
      i += 4;
      continue;
    }

    if (json.slice(i, i + 5) === 'false') {
      tokens.push({ type: 'boolean', value: 'false' });
      i += 5;
      continue;
    }

    if (json.slice(i, i + 4) === 'null') {
      tokens.push({ type: 'null', value: 'null' });
      i += 4;
      continue;
    }

    // Unknown character, skip
    i++;
  }

  return tokens;
}

const tokenColorMap: Record<TokenType, string> = {
  string: 'text-accent-sky',
  number: 'text-accent-sun',
  boolean: 'text-accent-rose',
  null: 'text-accent-mint',
  key: 'text-accent-mint-ink font-medium',
  bracket: 'text-text',
  punctuation: 'text-text-secondary',
  whitespace: '', // Preserve whitespace as-is
};

export function SyntaxHighlight({
  json,
  className = '',
}: SyntaxHighlightProps) {
  const tokens = useMemo(() => tokenizeJson(json), [json]);

  return (
    <code
      className={`
        block p-4 bg-surface rounded-lg border border-surface-muted
        font-mono text-sm leading-relaxed overflow-x-auto
        ${className}
      `}
    >
      {tokens.map((token, index) => {
        const color = tokenColorMap[token.type];

        // Render whitespace as-is, other tokens with color
        if (token.type === 'whitespace') {
          return (
            <span key={index} className="whitespace-pre">
              {token.value}
            </span>
          );
        }

        return (
          <span key={index} className={color}>
            {token.value}
          </span>
        );
      })}
    </code>
  );
}
