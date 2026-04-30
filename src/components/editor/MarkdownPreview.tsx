import {CheckSquare, ImageOff, Square} from 'lucide-react';
import type {ReactNode} from 'react';
import type {MarkdownBlock} from '../../utils/markdown';

interface MarkdownPreviewProps {
  blocks: MarkdownBlock[];
  className?: string;
}

function renderInline(text: string) {
  const parts: ReactNode[] = [];
  const pattern = /(\[\[[^\]]+\]\]|`[^`]+`)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) {
      continue;
    }

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const value = match[0];
    if (value.startsWith('[[')) {
      parts.push(
        <span
          key={`${value}-${match.index}`}
          className="rounded bg-blue-50 px-1 py-0.5 font-medium text-blue-700"
        >
          {value.slice(2, -2)}
        </span>,
      );
    } else {
      parts.push(
        <code key={`${value}-${match.index}`} className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">
          {value.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = match.index + value.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function MarkdownPreview({blocks, className = ''}: MarkdownPreviewProps) {
  const renderHeading = (block: MarkdownBlock) => {
    const sizeClass =
      block.level === 1
        ? 'text-3xl'
        : block.level === 2
          ? 'text-2xl'
          : block.level === 3
            ? 'text-xl'
            : 'text-lg';
    const className = `${sizeClass} pt-2 font-bold leading-tight text-slate-900`;
    const content = renderInline(block.text);

    if (block.level === 1) {
      return <h1 key={block.id} className={className}>{content}</h1>;
    }

    if (block.level === 2) {
      return <h2 key={block.id} className={className}>{content}</h2>;
    }

    if (block.level === 3) {
      return <h3 key={block.id} className={className}>{content}</h3>;
    }

    return <h4 key={block.id} className={className}>{content}</h4>;
  };

  return (
    <div className={`space-y-3 text-sm leading-7 text-slate-700 ${className}`}>
      {blocks.map((block) => {
        if (block.type === 'blank') {
          return <div key={block.id} className="h-2" />;
        }

        if (block.type === 'heading') {
          return renderHeading(block);
        }

        if (block.type === 'list') {
          return (
            <div key={block.id} className="flex gap-2 pl-1">
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>{renderInline(block.text)}</span>
            </div>
          );
        }

        if (block.type === 'task') {
          return (
            <div key={block.id} className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2">
              {block.checked ? (
                <CheckSquare className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Square className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
              )}
              <span className={block.checked ? 'text-slate-400 line-through' : ''}>{renderInline(block.text)}</span>
            </div>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={block.id} className="border-l-4 border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
              {renderInline(block.text)}
            </blockquote>
          );
        }

        if (block.type === 'code') {
          return (
            <pre
              key={block.id}
              className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100 shadow-inner"
            >
              {block.language && <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">{block.language}</div>}
              <code>{block.text || ' '}</code>
            </pre>
          );
        }

        if (block.type === 'image') {
          return (
            <figure key={block.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {block.src ? (
                <img src={block.src} alt={block.alt ?? ''} className="max-h-80 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center text-slate-400">
                  <ImageOff className="h-6 w-6" />
                </div>
              )}
              {block.alt && <figcaption className="px-3 py-2 text-xs text-slate-500">{block.alt}</figcaption>}
            </figure>
          );
        }

        if (block.type === 'table') {
          return (
            <pre key={block.id} className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              {block.raw}
            </pre>
          );
        }

        return (
          <p key={block.id} className="text-slate-700">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
