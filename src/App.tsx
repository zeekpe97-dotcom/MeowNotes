import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileText,
  Filter,
  Folder,
  Home,
  Image,
  Layers,
  Link2,
  Maximize2,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Network,
  Package,
  Pin,
  Play,
  Plus,
  Quote,
  Search,
  Settings,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import {MarkdownBlockEditor} from './components/editor/MarkdownBlockEditor';
import {
  appBootstrap,
  catInteract,
  createNote,
  getGraph,
  importAsset,
  loadNote,
  runAIAction,
  saveAIProvider,
  searchNotes,
  updateNoteContent,
} from './services/tauriClient';
import type {
  AIProviderConfig,
  AppBootstrap,
  CatMood,
  CatState,
  ChatMessage,
  FolderNode,
  KnowledgeGraph,
  NoteDetail,
  NoteSummary,
} from './types/models';

const aiActionMap = {
  summarize: '总结当前内容',
  mindmap: '生成思维导图',
  related: '推荐相关笔记',
  explain: '解释选中文本',
} as const;

type AIAction = keyof typeof aiActionMap;

export default function App() {
  const [bootstrap, setBootstrap] = useState<AppBootstrap | null>(null);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [activeNote, setActiveNote] = useState<NoteDetail | null>(null);
  const [graph, setGraph] = useState<KnowledgeGraph>({nodes: [], edges: []});
  const [cat, setCat] = useState<CatState | null>(null);
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '嗨！我是你的 AI 猫咪助手，有什么可以帮你的吗？',
      createdAt: new Date().toISOString(),
    },
  ]);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    appBootstrap().then((data) => {
      setBootstrap(data);
      setNotes(data.notes);
      setActiveNote(data.activeNote);
      setGraph(data.graph);
      setCat(data.cat);
      setProviders(data.providers);
    });
  }, []);

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    const timer = window.setTimeout(() => {
      searchNotes(searchKeyword).then((result) => {
        setNotes(searchKeyword.trim() || result.length > 0 ? result : bootstrap.notes);
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [bootstrap, searchKeyword]);

  const pinnedNotes = useMemo(() => notes.filter((note) => note.pinned), [notes]);
  const regularNotes = useMemo(() => notes.filter((note) => !note.pinned), [notes]);
  async function handleCreateNote() {
    const note = await createNote('未命名笔记', 'articles');
    setActiveNote(note);
    setNotes((current) => [note, ...current]);
    setSaveState('saved');
    setCat(await catInteract('note_created', {noteId: note.id}));
  }

  async function handleSelectNote(noteId: string) {
    const note = await loadNote(noteId);
    setActiveNote(note);
    setSaveState('saved');
    setGraph(await getGraph(note.id));
  }

  function handleEditorChange(markdown: string) {
    if (!activeNote) {
      return;
    }

    const nextNote = {...activeNote, markdown};
    setActiveNote(nextNote);
    setSaveState('dirty');

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      setSaveState('saving');
      const savedNote = await updateNoteContent(activeNote.id, markdown);
      setActiveNote(savedNote);
      setNotes((current) => current.map((note) => (note.id === savedNote.id ? savedNote : note)));
      setGraph(await getGraph(savedNote.id));
      setCat(await catInteract('note_saved', {wordCount: savedNote.wordCount}));
      setSaveState('saved');
    }, 650);
  }

  async function handleAIAction(action: AIAction, selectedText = '') {
    if (!activeNote) {
      return;
    }

    setCat(await catInteract('ai_thinking', {action}));
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: aiActionMap[action],
      createdAt: new Date().toISOString(),
    };
    setChatMessages((current) => [...current, userMessage]);

    const content = await runAIAction(action, activeNote, selectedText);
    setChatMessages((current) => [
      ...current,
      {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
    setCat(await catInteract('ai_done', {action}));
  }

  async function handleProviderSave(provider: AIProviderConfig) {
    setProviders(await saveAIProvider(provider));
  }

  if (!bootstrap || !activeNote || !cat) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fa] text-sm text-slate-500">
        正在启动 MeowNotes 本地知识库...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full gap-2 overflow-hidden bg-[#f8f9fa] p-2 font-sans text-slate-800">
      <NavigationSidebar
        folders={bootstrap.folders}
        cat={cat}
        onCreateNote={handleCreateNote}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <NoteListSidebar
        notes={regularNotes}
        pinnedNotes={pinnedNotes}
        activeNoteId={activeNote.id}
        graph={graph}
        searchKeyword={searchKeyword}
        onSearch={setSearchKeyword}
        onSelectNote={handleSelectNote}
      />

      <EditorPane
        note={activeNote}
        saveState={saveState}
        noteCandidates={notes}
        onChange={handleEditorChange}
        onAICommand={(selectedText) => handleAIAction('summarize', selectedText)}
      />

      <AICatSidebar
        cat={cat}
        messages={chatMessages}
        onAction={handleAIAction}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {settingsOpen && (
        <SettingsDialog
          vaultPath={bootstrap.vaultPath}
          providers={providers}
          onSaveProvider={handleProviderSave}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function NavigationSidebar({
  folders,
  cat,
  onCreateNote,
  onOpenSettings,
}: {
  folders: FolderNode[];
  cat: CatState;
  onCreateNote: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <nav className="flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-50 p-4">
        <div className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#fcebe4] text-lg">🐱</div>
          <span className="text-sm font-medium">MeowNotes</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
        <button className="text-slate-400 hover:text-slate-600" onClick={onCreateNote} title="新建笔记">
          <FileText className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-3">
        <button
          className="flex w-full items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-sm text-white transition-colors hover:bg-slate-800"
          onClick={onCreateNote}
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>新建笔记</span>
          </div>
          <span className="rounded bg-slate-800 px-1.5 font-mono text-xs text-slate-400">Ctrl N</span>
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-2 pb-4">
        <div className="space-y-0.5">
          <NavItem icon={<Home className="h-4 w-4" />} label="快速入口" active />
          <NavItem icon={<FileText className="h-4 w-4" />} label="全部笔记" />
          <NavItem icon={<Network className="h-4 w-4" />} label="知识图谱" />
          <NavItem icon={<Tag className="h-4 w-4" />} label="标签" />
          <NavItem icon={<CheckCircle2 className="h-4 w-4" />} label="任务" badge="12" />
          <NavItem icon={<Package className="h-4 w-4" />} label="资源库" />
          <NavItem icon={<Layers className="h-4 w-4" />} label="模板库" />
          <NavItem icon={<Trash2 className="h-4 w-4" />} label="回收站" />
        </div>

        <div>
          <div className="group flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-400">
            <span>文件夹</span>
            <Plus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="space-y-0.5">
            {folders.map((folder) => (
              <FolderItem key={folder.id} folder={folder} />
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-4 border-t border-slate-50 p-4">
        <div className="group relative cursor-pointer overflow-hidden rounded-xl bg-[#fef6ee] p-3">
          <div className="relative z-10">
            <h4 className="mb-1 text-sm font-medium text-amber-900">专注时光</h4>
            <p className="text-xs text-amber-700">{cat.focusMinutes} 分钟</p>
            <button className="mt-2 rounded-full bg-white/80 p-1.5 text-amber-900 shadow-sm transition-colors hover:bg-white">
              <Play className="ml-0.5 h-3 w-3" />
            </button>
          </div>
          <div className="absolute bottom-[-12px] right-[-8px] flex h-20 w-20 items-center justify-center rounded-full bg-white/60 text-5xl">
            {catEmoji(cat.mood)}
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <button className="rounded-lg p-1.5 transition-colors hover:bg-slate-50 hover:text-slate-600" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </button>
          <div className="flex gap-1">
            <button className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NoteListSidebar({
  notes,
  pinnedNotes,
  activeNoteId,
  graph,
  searchKeyword,
  onSearch,
  onSelectNote,
}: {
  notes: NoteSummary[];
  pinnedNotes: NoteSummary[];
  activeNoteId: string;
  graph: KnowledgeGraph;
  searchKeyword: string;
  onSearch: (keyword: string) => void;
  onSelectNote: (noteId: string) => void;
}) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-50 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="搜索笔记..."
            className="w-full rounded-lg border-none bg-slate-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-200"
          />
        </div>
        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
        {pinnedNotes.length > 0 && (
          <NoteGroup title="置顶">
            {pinnedNotes.map((note) => (
              <NoteItem key={note.id} note={note} active={note.id === activeNoteId} onClick={() => onSelectNote(note.id)} />
            ))}
          </NoteGroup>
        )}
        <NoteGroup title={searchKeyword ? '搜索结果' : '今天'}>
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} active={note.id === activeNoteId} onClick={() => onSelectNote(note.id)} />
          ))}
        </NoteGroup>
      </div>

      <MiniKnowledgeGraph graph={graph} />
    </aside>
  );
}

function EditorPane({
  note,
  saveState,
  noteCandidates,
  onChange,
  onAICommand,
}: {
  note: NoteDetail;
  saveState: 'saved' | 'saving' | 'dirty';
  noteCandidates: NoteSummary[];
  onChange: (markdown: string) => void;
  onAICommand: (selectedText: string) => void;
}) {
  return (
    <main className="flex h-full min-w-0 shrink flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex border-b border-slate-100">
        <div className="flex items-center gap-2 border-r border-slate-100 bg-white px-4 py-2.5">
          <span className="text-xl">{note.icon}</span>
          <span className="text-sm font-medium text-slate-800">{note.title}</span>
        </div>
        <button className="flex cursor-pointer items-center border-r border-slate-100 px-4 py-2.5 text-slate-400 transition-colors hover:bg-slate-50">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-between px-8 py-4 text-sm">
        <div className="flex min-w-0 items-center text-slate-400">
          <span className="ml-2 flex min-w-0 items-center gap-1.5">
            <span className="text-slate-500">02 技术沉淀</span>
            <span className="text-xs">/</span>
            <span className="truncate font-medium text-slate-800">{note.title}</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1 text-xs">
            {saveState === 'saving' ? '保存中' : saveState === 'dirty' ? '未保存' : '已保存'}
            <CheckCircle2 className={`h-3 w-3 ${saveState === 'saved' ? 'text-emerald-500' : 'text-amber-500'}`} />
          </span>
          <div className="h-4 w-px bg-slate-200" />
          <button className="transition-colors hover:text-slate-800">
            <Bookmark className="h-4 w-4" />
          </button>
          <button className="transition-colors hover:text-slate-800">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <MarkdownBlockEditor
        value={note.markdown}
        noteCandidates={noteCandidates.map((candidate) => ({
          id: candidate.id,
          title: candidate.title,
          path: candidate.path,
        }))}
        className="min-h-0 flex-1 rounded-none border-0"
        onChange={onChange}
        onAISummarize={onAICommand}
        onImageImport={importAsset}
      />

      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
        <div className="flex items-center gap-6">
          <span>字数: {note.wordCount}</span>
          <span>链接: {(note.markdown.match(/\[\[/g) ?? []).length}</span>
          <div className="flex items-center gap-2">
            <span>标签:</span>
            {note.tags.map((tag) => (
              <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-slate-500">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function AICatSidebar({
  cat,
  messages,
  onAction,
  onOpenSettings,
}: {
  cat: CatState;
  messages: ChatMessage[];
  onAction: (action: AIAction) => void;
  onOpenSettings: () => void;
}) {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#faeadd] bg-[#fdfaf6] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#faeadd] p-4">
        <div className="flex items-center gap-2 font-medium text-amber-900">
          <span>🐾</span>
          <span>喵咪助手</span>
          <ChevronDown className="h-4 w-4 text-amber-900/50" />
        </div>
        <button className="rounded-lg p-1.5 text-amber-900/60 transition-colors hover:bg-[#faeadd] hover:text-amber-900" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <div className="mb-5 space-y-3">
          {messages.slice(-3).map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role !== 'user' && <div className="mt-1 text-xl">{catEmoji(cat.mood)}</div>}
              <div
                className={`max-w-[220px] whitespace-pre-wrap rounded-2xl border p-3 text-sm shadow-sm ${
                  message.role === 'user'
                    ? 'rounded-tr-sm border-slate-200 bg-slate-900 text-white'
                    : 'rounded-tl-sm border-[#faeadd] bg-white text-slate-700'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="relative mb-6 flex flex-1 flex-col items-center justify-center">
          <div className="absolute left-6 top-0 h-4 w-4 rounded-full bg-rose-300 opacity-80 blur-[1px]" />
          <div className="absolute bottom-10 right-4 h-2 w-2 rounded-full bg-amber-400 opacity-60" />
          <div className="z-10 flex h-48 w-48 items-center justify-center rounded-full border-4 border-white bg-white text-8xl shadow-lg transition-transform duration-300 hover:scale-[1.03]">
            {catEmoji(cat.mood)}
          </div>
          <div className="relative z-0 mt-2 h-4 w-32 rounded-[100%] bg-amber-900/10 blur-sm" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          <ActionButton icon={<FileText className="h-4 w-4 text-amber-600" />} label="总结当前内容" onClick={() => onAction('summarize')} />
          <ActionButton icon={<Network className="h-4 w-4 text-emerald-600" />} label="生成思维导图" onClick={() => onAction('mindmap')} />
          <ActionButton icon={<Search className="h-4 w-4 text-blue-600" />} label="推荐相关笔记" onClick={() => onAction('related')} />
          <ActionButton icon={<MessageSquare className="h-4 w-4 text-purple-600" />} label="解释选中文本" onClick={() => onAction('explain')} />
        </div>

        <div className="mb-4 rounded-xl border border-[#faeadd] bg-white p-4 shadow-sm">
          <div className="mb-3 text-xs font-medium text-slate-500">今日陪伴</div>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-end justify-between">
                <div className="text-sm font-medium text-slate-800">
                  陪伴等级 <span className="text-amber-600">Lv.{cat.level}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {cat.xp} / {cat.nextLevelXp} XP
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400"
                  style={{width: `${Math.min(100, (cat.xp / cat.nextLevelXp) * 100)}%`}}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-0.5 text-xs text-slate-500">心情状态</div>
                <div className="text-xs font-medium text-slate-800">{cat.message}</div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-lg">{catEmoji(cat.mood)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#faeadd] bg-white p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="和喵咪聊点什么..."
            className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-4 pr-10 text-sm shadow-sm transition-all focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-200"
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-800 p-1.5 text-white shadow-sm transition-colors hover:bg-slate-700"
            onClick={() => onAction('summarize')}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SettingsDialog({
  vaultPath,
  providers,
  onSaveProvider,
  onClose,
}: {
  vaultPath: string;
  providers: AIProviderConfig[];
  onSaveProvider: (provider: AIProviderConfig) => void;
  onClose: () => void;
}) {
  const [drafts, setDrafts] = useState(providers);

  function updateProvider(id: string, patch: Partial<AIProviderConfig>) {
    setDrafts((current) => current.map((provider) => (provider.id === id ? {...provider, ...patch} : provider)));
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-6">
      <div className="max-h-full w-[720px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">设置</h2>
            <p className="mt-1 text-xs text-slate-500">配置本地 Vault 和大模型厂商，密钥仅保存于本机。</p>
          </div>
          <button className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <section className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">本地知识库</h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{vaultPath}</div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">大模型配置</h3>
            <div className="space-y-3">
              {drafts.map((provider) => (
                <div key={provider.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-medium text-slate-800">{provider.name}</div>
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        checked={provider.enabled}
                        onChange={(event) => updateProvider(provider.id, {enabled: event.target.checked})}
                      />
                      启用
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SettingsInput label="Base URL" value={provider.baseUrl} onChange={(value) => updateProvider(provider.id, {baseUrl: value})} />
                    <SettingsInput label="Model" value={provider.model} onChange={(value) => updateProvider(provider.id, {model: value})} />
                    <SettingsInput
                      label="API Key"
                      value={provider.apiKey}
                      type="password"
                      onChange={(value) => updateProvider(provider.id, {apiKey: value})}
                    />
                    <div className="flex items-end">
                      <button
                        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                        onClick={() => onSaveProvider(provider)}
                      >
                        保存 {provider.name}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingsInput({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  type?: 'text' | 'password';
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-300"
      />
    </label>
  );
}

function MiniKnowledgeGraph({graph}: {graph: KnowledgeGraph}) {
  const positions = [
    'left-[44%] top-[8%]',
    'right-[4%] top-[20%]',
    'left-[4%] top-[20%]',
    'right-[12%] bottom-[18%]',
    'left-[10%] bottom-[12%]',
  ];

  return (
    <div className="m-2 shrink-0 rounded-xl border-t border-slate-50 bg-slate-50/50 p-4">
      <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-700">
        <span>知识图谱</span>
        <Maximize2 className="h-3 w-3 cursor-pointer text-slate-400" />
      </div>
      <div className="relative flex h-32 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full text-slate-200" viewBox="0 0 100 100">
          {graph.edges.map((edge, index) => (
            <line key={`${edge.source}-${edge.target}`} x1="50" y1="50" x2={index % 2 ? 78 : 22} y2={index < 2 ? 22 : 78} stroke="currentColor" strokeWidth="1" />
          ))}
        </svg>
        {graph.nodes.slice(0, 5).map((node, index) => (
          <div key={node.id} className={`absolute ${positions[index]} flex flex-col items-center text-[10px] text-slate-500`}>
            <div className={`mb-1 h-2 w-2 rounded-full ${node.color}`} />
            <span className="max-w-[58px] truncate">{node.label}</span>
          </div>
        ))}
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-blue-500 px-2 py-1 text-[10px] font-medium text-white">
          知识库系统
        </div>
      </div>
    </div>
  );
}

function FolderItem({folder}: {folder: FolderNode}) {
  return (
    <div>
      <div className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50">
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium">{folder.name}</span>
      </div>
      <div className="mt-0.5 space-y-0.5">
        {folder.children?.map((child) => (
          <NavItem key={child.id} icon={<Folder className="h-4 w-4" />} label={child.name} badge={String(child.count)} indent />
        ))}
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  badge,
  indent = false,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  indent?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
        indent ? 'pl-8' : ''
      } ${active ? 'bg-slate-100/70 font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`text-slate-400 transition-colors group-hover:text-slate-600 ${active ? '!text-slate-600' : ''}`}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && <span className="text-xs text-slate-400 transition-colors group-hover:text-slate-500">{badge}</span>}
    </div>
  );
}

function NoteGroup({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 px-3 text-xs font-medium text-slate-400">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NoteItem({note, active, onClick}: {note: NoteSummary; active: boolean; onClick: () => void}) {
  return (
    <button
      className={`group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active ? 'bg-orange-50 font-medium text-amber-900' : 'text-slate-700 hover:bg-slate-50'
      }`}
      onClick={onClick}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="shrink-0">{note.icon}</span>
        <span className="truncate">{note.title}</span>
      </div>
      {note.pinned ? <Pin className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : <MoreHorizontal className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100" />}
    </button>
  );
}

function ActionButton({icon, label, onClick}: {icon: React.ReactNode; label: string; onClick: () => void}) {
  return (
    <button
      className="flex items-center justify-center gap-2 rounded-xl border border-[#faeadd] bg-white p-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-[#fff9ef]"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function catEmoji(mood: CatMood) {
  const emojiMap: Record<CatMood, string> = {
    idle: '😺',
    happy: '😻',
    thinking: '🤔',
    focus: '😼',
    sleeping: '😴',
    error: '🙀',
  };
  return emojiMap[mood];
}

export const editorToolbarHints = [
  {icon: Code2, label: '代码块'},
  {icon: Image, label: '图片'},
  {icon: Quote, label: '引用'},
  {icon: Link2, label: '双链'},
];
