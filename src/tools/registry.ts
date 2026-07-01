/**
 * Tool Registry — compile-time source of truth
 * New tools: add a ToolMeta entry, add messages keys, implement component, wire slug branch
 */

import { ToolMeta } from './types';

export const tools: ToolMeta[] = [
  {
    id: 'ladder',
    slug: 'ladder',
    category: 'random',
    icon: 'ListTree',
    accent: 'coral',
    status: 'live',
    isNew: true,
    isPopular: true,
    order: 1,
    keywords: ['사다리', '사다리타기', 'ladder', 'ghost leg', '추첨', '제비뽑기', '아미다쿠지', 'amidakuji'],
  },
  {
    id: 'qna-a-day',
    slug: 'qna-a-day',
    category: 'mindset',
    icon: 'NotebookPen',
    accent: 'grape',
    status: 'live',
    isNew: true,
    order: 2,
    keywords: ['1일1질문', '하루한질문', '365질문', '질문일기', '자기성찰', '일기', '저널', 'q&a a day', 'daily question', 'journal', 'self reflection', 'one question a day'],
  },
  {
    id: 'new-word',
    slug: 'new-word',
    category: 'text',
    icon: 'BookA',
    accent: 'mint',
    status: 'live',
    isNew: true,
    order: 10,
    keywords: ['신조어', '유행어', 'MZ', '밈', '용어', '용어사전', '트렌드', '바이브코딩', '바이브 코딩', '루프엔지니어링', '갓생', '억까', '새로운 말', 'new word', 'slang', 'glossary', 'terms', 'vibe coding', 'trend', 'buzzword'],
  },
];

/** Get all live tools for static generation */
export function getLiveTools() {
  return tools.filter((tool) => tool.status === 'live');
}

/** Get tool by slug */
export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
