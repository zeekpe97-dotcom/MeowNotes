import {useEffect, useMemo, useRef, useState} from 'react';
import type {ChangeEvent, FormEvent, KeyboardEvent, ReactNode} from 'react';
import {Eye, FileText, LayoutPanelLeft, PencilLine} from 'lucide-react';
import {countWords, extractWikiLinks, markdownToBlocks} from '../../utils/markdown';
import {EditorToolbar, type ToolbarAction} from './EditorToolbar';
import {MarkdownPreview} from './MarkdownPreview';
import {
  defaultSlashCommands,
  SlashCommandMenu,
  type SlashCommand,
  type SlashCommandId,
} from './SlashCommandMenu';
import {WikiLinkSuggest, type WikiLinkCandidate} from './WikiLinkSuggest';

type EditorMode = 'split' | 'write' | 'block' | 'preview';

export interface MarkdownBlockEditorProps {
  value?: string;
  defaultValue?: string;
  noteCandidates?: WikiLinkCandidate[];
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onChange?: (markdown: string) => void;
  onSave?: (markdown: string) => void;
  onAISummarize?: (markdown: string) => void;
  onImageImport?: (sourcePath: string) => Promise<string>;
}

const defaultCandidates: WikiLinkCandidate[] = [
  {id: 'knowledge', title: '如何打造高效的知识库系统', path: '02 技术沉淀/技术文章'},
  {id: 'ai-product', title: 'AI 时代的产品思维', path: '02 技术沉淀/技术文章'},
  {id: 'meownotes-design', title: 'MeowNotes 功能设计思路', path: '01 工作项目/产品方案'},
  {id: 'daily-review', title: '每日复盘模板', path: '03 个人成长/模板'},
];

const commandSnippets: Record<SlashCommandId, string> = {
  heading: '# 新标题',
  list: '- 列表项',
  task: '- [ ] 待办事项',
  code: '```ts\n\n```',
  image: '![图片描述](https://example.com/image.png)',
  quote: '> 引用内容',
  aiSummary: '> [!ai] AI 总结\n> 这里会显示当前笔记的总结。',
};

function getSlashRange(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor);
  const lineStart = Math.max(beforeCursor.lastIndexOf('\n') + 1, 0);
  const lineBeforeCursor = beforeCursor.slice(lineStart);
  const slashIndex = lineBeforeCursor.lastIndexOf('/');

  if (slashIndex < 0) {
    return null;
  }

  const prefix = lineBeforeCursor.slice(0, slashIndex);
  const query = lineBeforeCursor.slice(slashIndex + 1);
  const isCommandStart = prefix.trim().length === 0;

  if (!isCommandStart || /\s/.test(query)) {
    return null;
  }

  return {
    start: lineStart + slashIndex,
    end: cursor,
    query: query.toLowerCase(),
  };
}

function getWikiRange(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor);
  const openIndex = beforeCursor.lastIndexOf('[[');

  if (openIndex < 0) {
    return null;
  }

  const query = beforeCursor.slice(openIndex + 2);
  if (query.includes(']]') || query.includes('\n')) {
    return null;
  }

  return {
    start: openIndex,
    end: cursor,
    query: query.toLowerCase(),
  };
}

function replaceRange(value: string, start: number, end: number, replacement: string) {
  return `${value.slice(0, start)}${replacement}${value.slice(end)}`;
}

export function MarkdownBlockEditor({
  value,
  defaultValue = '',
  noteCandidates = defaultCandidates,
  placeholder = '输入 Markdown，或输入 / 打开命令面板，输入 [[ 建立双链',
  autoFocus = false,
  className = '',
  onChange,
  onSave,
  onAISummarize,
  onImageImport,
}: MarkdownBlockEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const blockEditorRef = useRef<HTMLDivElement | null>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [mode, setMode] = useState<EditorMode>('split');
  const [slashQuery, setSlashQuery] = useState('');
  const [slashRange, setSlashRange] = useState<{start: number; end: number} | null>(null);
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiRange, setWikiRange] = useState<{start: number; end: number} | null>(null);
  const [activeWikiIndex, setActiveWikiIndex] = useState(0);

  const markdown = value ?? internalValue;
  const blocks = useMemo(() => markdownToBlocks(markdown), [markdown]);
  const wikiLinks = useMemo(() => extractWikiLinks(markdown), [markdown]);
  const wordCount = useMemo(() => countWords(markdown), [markdown]);

  const filteredCommands = useMemo(() => {
    if (!slashRange) {
      return [];
    }

    return defaultSlashCommands.filter((command) => {
      const keyword = `${command.title} ${command.description} ${command.id}`.toLowerCase();
      return keyword.includes(slashQuery);
    });
  }, [slashQuery, slashRange]);

  const filteredWikiCandidates = useMemo(() => {
    if (!wikiRange) {
      return [];
    }

    return noteCandidates
      .filter((candidate) => candidate.title.toLowerCase().includes(wikiQuery))
      .slice(0, 8);
  }, [noteCandidates, wikiQuery, wikiRange]);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setActiveSlashIndex(0);
  }, [slashQuery]);

  useEffect(() => {
    setActiveWikiIndex(0);
  }, [wikiQuery]);

  const commitChange = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  };

  const syncFloatingMenus = (nextValue: string, cursor: number) => {
    const nextWikiRange = getWikiRange(nextValue, cursor);
    if (nextWikiRange) {
      setWikiRange({start: nextWikiRange.start, end: nextWikiRange.end});
      setWikiQuery(nextWikiRange.query);
    } else {
      setWikiRange(null);
      setWikiQuery('');
    }

    const nextSlashRange = getSlashRange(nextValue, cursor);
    if (nextSlashRange) {
      setSlashRange({start: nextSlashRange.start, end: nextSlashRange.end});
      setSlashQuery(nextSlashRange.query);
    } else {
      setSlashRange(null);
      setSlashQuery('');
    }
  };

  const focusTextareaAt = (position: number) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(position, position);
    });
  };

  const insertText = (snippet: string, options?: {replace?: {start: number; end: number}; cursorOffset?: number}) => {
    const textarea = textareaRef.current;
    const start = options?.replace?.start ?? textarea?.selectionStart ?? markdown.length;
    const end = options?.replace?.end ?? textarea?.selectionEnd ?? markdown.length;
    const nextValue = replaceRange(markdown, start, end, snippet);
    const cursorPosition = start + (options?.cursorOffset ?? snippet.length);

    commitChange(nextValue);
    setSlashRange(null);
    setWikiRange(null);
    focusTextareaAt(cursorPosition);
  };

  const applyToolbarAction = (action: ToolbarAction) => {
    const actions: Partial<Record<ToolbarAction, () => void>> = {
      heading: () => insertText('# 新标题', {cursorOffset: 4}),
      list: () => insertText('- 列表项', {cursorOffset: 2}),
      task: () => insertText('- [ ] 待办事项', {cursorOffset: 6}),
      code: () => insertText('```ts\n\n```', {cursorOffset: 6}),
      image: () => void insertImage(),
      quote: () => insertText('> 引用内容', {cursorOffset: 2}),
      wikiLink: () => insertText('[[笔记标题]]', {cursorOffset: 2}),
      aiSummary: () => {
        onAISummarize?.(markdown);
        insertText('\n> [!ai] AI 总结\n> 这里会显示当前笔记的总结。\n');
      },
      save: () => onSave?.(markdown),
    };

    actions[action]?.();
  };

  const selectSlashCommand = (command: SlashCommand) => {
    const range = slashRange;
    if (!range) {
      return;
    }

    if (command.id === 'image') {
      void insertImage(range);
      return;
    }

    insertText(commandSnippets[command.id], {
      replace: range,
      cursorOffset: command.id === 'code' ? 6 : commandSnippets[command.id].length,
    });
  };

  const insertImage = async (replace?: {start: number; end: number}) => {
    const sourcePath = window.prompt('请输入本地图片路径');
    if (!sourcePath) {
      return;
    }

    const storedPath = onImageImport ? await onImageImport(sourcePath) : sourcePath;
    insertText(`![图片描述](${storedPath})`, {
      replace,
      cursorOffset: 2,
    });
  };

  const selectWikiCandidate = (candidate: WikiLinkCandidate) => {
    const range = wikiRange;
    if (!range) {
      return;
    }

    const replacement = `[[${candidate.title}]]`;
    insertText(replacement, {
      replace: range,
      cursorOffset: replacement.length,
    });
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    const cursor = event.target.selectionStart;

    commitChange(nextValue);
    syncFloatingMenus(nextValue, cursor);
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (wikiRange && filteredWikiCandidates.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveWikiIndex((index) => (index + 1) % filteredWikiCandidates.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveWikiIndex((index) => (index - 1 + filteredWikiCandidates.length) % filteredWikiCandidates.length);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        selectWikiCandidate(filteredWikiCandidates[activeWikiIndex]);
        return;
      }
    }

    if (slashRange && filteredCommands.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveSlashIndex((index) => (index + 1) % filteredCommands.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveSlashIndex((index) => (index - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        selectSlashCommand(filteredCommands[activeSlashIndex]);
        return;
      }
    }

    if (event.key === 'Escape') {
      setSlashRange(null);
      setWikiRange(null);
    }
  };

  const handleTextareaClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    syncFloatingMenus(markdown, textarea.selectionStart);
  };

  const handleBlockEditorInput = (event: FormEvent<HTMLDivElement>) => {
    // contentEditable 只作为轻量 Block 原型，真实 Markdown 仍由 textarea 保持结构化。
    commitChange(event.currentTarget.innerText);
  };

  const modeButtons: Array<{id: EditorMode; label: string; icon: ReactNode}> = [
    {id: 'split', label: '分栏', icon: <LayoutPanelLeft className="h-3.5 w-3.5" />},
    {id: 'write', label: 'Markdown', icon: <PencilLine className="h-3.5 w-3.5" />},
    {id: 'block', label: 'Block', icon: <FileText className="h-3.5 w-3.5" />},
    {id: 'preview', label: '预览', icon: <Eye className="h-3.5 w-3.5" />},
  ];

  return (
    <section className={`flex h-full min-h-[520px] flex-col overflow-hidden rounded-xl border border-slate-100 bg-white ${className}`}>
      <EditorToolbar onAction={applyToolbarAction} canSave={Boolean(onSave)} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2">
        <div className="flex items-center gap-1 rounded-md bg-white p-1 shadow-sm">
          {modeButtons.map((button) => (
            <button
              key={button.id}
              type="button"
              onClick={() => setMode(button.id)}
              className={`inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium transition-colors ${
                mode === button.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {button.icon}
              {button.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>{wordCount} 字词</span>
          <span>{blocks.filter((block) => block.type !== 'blank').length} blocks</span>
          <span>{wikiLinks.length} 双链</span>
        </div>
      </div>

      <div className="relative grid min-h-0 flex-1 bg-white">
        {(mode === 'split' || mode === 'write') && (
          <div className={mode === 'split' ? 'grid min-h-0 grid-cols-2' : 'min-h-0'}>
            <div className="relative min-h-0 border-r border-slate-100">
              <textarea
                ref={textareaRef}
                value={markdown}
                placeholder={placeholder}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}
                onClick={handleTextareaClick}
                onKeyUp={handleTextareaClick}
                spellCheck={false}
                className="h-full min-h-[420px] w-full resize-none bg-white px-6 py-5 font-mono text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-300"
              />
              {slashRange && (
                <SlashCommandMenu
                  commands={filteredCommands}
                  activeIndex={activeSlashIndex}
                  onSelect={selectSlashCommand}
                />
              )}
              {wikiRange && (
                <WikiLinkSuggest
                  candidates={filteredWikiCandidates}
                  activeIndex={activeWikiIndex}
                  onSelect={selectWikiCandidate}
                />
              )}
            </div>

            {mode === 'split' && (
              <div className="min-h-0 overflow-y-auto px-6 py-5">
                <MarkdownPreview blocks={blocks} />
              </div>
            )}
          </div>
        )}

        {mode === 'block' && (
          <div
            ref={blockEditorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleBlockEditorInput}
            className="min-h-[420px] overflow-y-auto px-8 py-6 text-sm leading-7 text-slate-700 outline-none"
          >
            <MarkdownPreview blocks={blocks} />
          </div>
        )}

        {mode === 'preview' && (
          <div className="min-h-[420px] overflow-y-auto px-8 py-6">
            <MarkdownPreview blocks={blocks} />
          </div>
        )}
      </div>
    </section>
  );
}
