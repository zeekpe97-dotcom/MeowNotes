export type MarkdownBlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'task'
  | 'quote'
  | 'code'
  | 'image'
  | 'table'
  | 'blank';

export interface WikiLinkMatch {
  title: string;
  start: number;
  end: number;
}

export interface MarkdownBlock {
  id: string;
  type: MarkdownBlockType;
  raw: string;
  text: string;
  level?: number;
  checked?: boolean;
  language?: string;
  alt?: string;
  src?: string;
}

const headingPattern = /^(#{1,6})\s+(.+)$/;
const imagePattern = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const listPattern = /^(\s*)([-*+]|\d+\.)\s+(.+)$/;
const taskPattern = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/;
const quotePattern = /^>\s?(.*)$/;
const wikiLinkPattern = /\[\[([^\]\n]+)\]\]/g;

const createBlockId = (index: number, type: MarkdownBlockType): string => `${type}-${index}`;

export function extractWikiLinks(markdown: string): WikiLinkMatch[] {
  const matches: WikiLinkMatch[] = [];

  for (const match of markdown.matchAll(wikiLinkPattern)) {
    const title = match[1].trim();

    if (!title || match.index === undefined) {
      continue;
    }

    matches.push({
      title,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return matches;
}

export function countWords(markdown: string): number {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[#>*_`~|[\]()-]/g, ' ');

  const cjkCharacters = plainText.match(/[\u3400-\u9fff]/g) ?? [];
  const words = plainText
    .replace(/[\u3400-\u9fff]/g, ' ')
    .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? [];

  return cjkCharacters.length + words.length;
}

export function markdownToBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const blockIndex = blocks.length;

    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      const rawLines = [line];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        rawLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        rawLines.push(lines[index]);
        index += 1;
      }

      blocks.push({
        id: createBlockId(blockIndex, 'code'),
        type: 'code',
        raw: rawLines.join('\n'),
        text: codeLines.join('\n'),
        language,
      });
      continue;
    }

    if (!line.trim()) {
      blocks.push({
        id: createBlockId(blockIndex, 'blank'),
        type: 'blank',
        raw: line,
        text: '',
      });
      index += 1;
      continue;
    }

    const headingMatch = line.match(headingPattern);
    if (headingMatch) {
      blocks.push({
        id: createBlockId(blockIndex, 'heading'),
        type: 'heading',
        raw: line,
        text: headingMatch[2],
        level: headingMatch[1].length,
      });
      index += 1;
      continue;
    }

    const imageMatch = line.trim().match(imagePattern);
    if (imageMatch) {
      blocks.push({
        id: createBlockId(blockIndex, 'image'),
        type: 'image',
        raw: line,
        text: imageMatch[1],
        alt: imageMatch[1],
        src: imageMatch[2],
      });
      index += 1;
      continue;
    }

    const taskMatch = line.match(taskPattern);
    if (taskMatch) {
      blocks.push({
        id: createBlockId(blockIndex, 'task'),
        type: 'task',
        raw: line,
        text: taskMatch[3],
        checked: taskMatch[2].toLowerCase() === 'x',
      });
      index += 1;
      continue;
    }

    const listMatch = line.match(listPattern);
    if (listMatch) {
      blocks.push({
        id: createBlockId(blockIndex, 'list'),
        type: 'list',
        raw: line,
        text: listMatch[3],
      });
      index += 1;
      continue;
    }

    const quoteMatch = line.match(quotePattern);
    if (quoteMatch) {
      blocks.push({
        id: createBlockId(blockIndex, 'quote'),
        type: 'quote',
        raw: line,
        text: quoteMatch[1],
      });
      index += 1;
      continue;
    }

    if (line.includes('|')) {
      blocks.push({
        id: createBlockId(blockIndex, 'table'),
        type: 'table',
        raw: line,
        text: line,
      });
      index += 1;
      continue;
    }

    blocks.push({
      id: createBlockId(blockIndex, 'paragraph'),
      type: 'paragraph',
      raw: line,
      text: line,
    });
    index += 1;
  }

  return blocks;
}
