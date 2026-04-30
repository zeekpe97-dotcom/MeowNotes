import {Braces, CheckSquare, Heading1, Image, List, Quote, Sparkles} from 'lucide-react';
import type {ReactNode} from 'react';

export type SlashCommandId = 'heading' | 'list' | 'task' | 'code' | 'image' | 'quote' | 'aiSummary';

export interface SlashCommand {
  id: SlashCommandId;
  title: string;
  description: string;
  icon: ReactNode;
}

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  activeIndex: number;
  onSelect: (command: SlashCommand) => void;
}

export const defaultSlashCommands: SlashCommand[] = [
  {
    id: 'heading',
    title: '标题',
    description: '插入一级标题',
    icon: <Heading1 className="h-4 w-4" />,
  },
  {
    id: 'list',
    title: '列表',
    description: '插入无序列表项',
    icon: <List className="h-4 w-4" />,
  },
  {
    id: 'task',
    title: '任务列表',
    description: '插入可勾选任务',
    icon: <CheckSquare className="h-4 w-4" />,
  },
  {
    id: 'code',
    title: '代码',
    description: '插入 fenced code block',
    icon: <Braces className="h-4 w-4" />,
  },
  {
    id: 'image',
    title: '图片',
    description: '插入图片 Markdown',
    icon: <Image className="h-4 w-4" />,
  },
  {
    id: 'quote',
    title: '引用',
    description: '插入引用块',
    icon: <Quote className="h-4 w-4" />,
  },
  {
    id: 'aiSummary',
    title: 'AI总结',
    description: '插入 AI 总结占位块',
    icon: <Sparkles className="h-4 w-4" />,
  },
];

export function SlashCommandMenu({commands, activeIndex, onSelect}: SlashCommandMenuProps) {
  if (commands.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-4 top-14 z-20 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-400">
        斜杠菜单
      </div>
      <div className="max-h-72 overflow-y-auto p-1">
        {commands.map((command, index) => (
          <button
            key={command.id}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(command);
            }}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
              index === activeIndex ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
              {command.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{command.title}</span>
              <span className="block truncate text-xs text-slate-400">{command.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
