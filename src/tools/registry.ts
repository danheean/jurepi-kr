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
    id: 'picker',
    slug: 'picker',
    category: 'random',
    icon: 'Dices',
    accent: 'rose',
    status: 'coming_soon',
    order: 2,
    keywords: ['추첨', 'picker', 'random'],
  },
  {
    id: 'wordcounter',
    slug: 'wordcounter',
    category: 'text',
    icon: 'Type',
    accent: 'mint',
    status: 'coming_soon',
    order: 3,
    keywords: ['글자', '단어', '세기', 'wordcounter', 'count'],
  },
  {
    id: 'unitconverter',
    slug: 'unitconverter',
    category: 'converter',
    icon: 'Ruler',
    accent: 'sky',
    status: 'coming_soon',
    order: 4,
    keywords: ['변환', '단위', 'converter', 'convert'],
  },
  {
    id: 'percentcalc',
    slug: 'percentcalc',
    category: 'calculator',
    icon: 'Percent',
    accent: 'sun',
    status: 'coming_soon',
    order: 5,
    keywords: ['계산기', '퍼센트', 'percent', 'calculator'],
  },
  {
    id: 'timer',
    slug: 'timer',
    category: 'fun',
    icon: 'Timer',
    accent: 'grape',
    status: 'coming_soon',
    order: 6,
    keywords: ['타이머', 'timer', 'time'],
  },
  {
    id: 'ddaycounter',
    slug: 'ddaycounter',
    category: 'calculator',
    icon: 'CalendarDays',
    accent: 'grape',
    status: 'coming_soon',
    order: 7,
    keywords: ['디데이', 'd-day', '날짜', 'counter'],
  },
  {
    id: 'qna-a-day',
    slug: 'qna-a-day',
    category: 'mindset',
    icon: 'NotebookPen',
    accent: 'grape',
    status: 'live',
    isNew: true,
    order: 8,
    keywords: ['1일1질문', '하루한질문', '365질문', '질문일기', '자기성찰', '일기', '저널', 'q&a a day', 'daily question', 'journal', 'self reflection', 'one question a day'],
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
