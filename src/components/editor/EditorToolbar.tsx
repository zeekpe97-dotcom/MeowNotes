import {
  Braces,
  CheckSquare,
  Heading1,
  Image,
  Link2,
  List,
  Quote,
  Save,
  Sparkles,
} from 'lucide-react';
import type {ReactNode} from 'react';

export type ToolbarAction =
  | 'heading'
  | 'list'
  | 'task'
  | 'code'
  | 'image'
  | 'quote'
  | 'wikiLink'
  | 'aiSummary'
  | 'save';

interface ToolbarButton {
  action: ToolbarAction;
  label: string;
  icon: ReactNode;
  shortcut?: string;
}

interface EditorToolbarProps {
  onAction: (action: ToolbarAction) => void;
  canSave?: boolean;
}

const toolbarButtons: ToolbarButton[] = [
  {action: 'heading', label: '标题', icon: <Heading1 className="h-4 w-4" />},
  {action: 'list', label: '列表', icon: <List className="h-4 w-4" />},
  {action: 'task', label: '任务列表', icon: <CheckSquare className="h-4 w-4" />},
  {action: 'code', label: '代码块', icon: <Braces className="h-4 w-4" />},
  {action: 'image', label: '图片', icon: <Image className="h-4 w-4" />},
  {action: 'quote', label: '引用', icon: <Quote className="h-4 w-4" />},
  {action: 'wikiLink', label: '双链', icon: <Link2 className="h-4 w-4" />},
];

export function EditorToolbar({onAction, canSave = true}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-1">
        {toolbarButtons.map((button) => (
          <button
            key={button.action}
            type="button"
            title={button.label}
            aria-label={button.label}
            onClick={() => onAction(button.action)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {button.icon}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onAction('aiSummary')}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-200"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI总结
        </button>
        {canSave && (
          <button
            type="button"
            onClick={() => onAction('save')}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <Save className="h-3.5 w-3.5" />
            保存
          </button>
        )}
      </div>
    </div>
  );
}
