import {fallbackBootstrap} from '../data/sampleData';
import type {
  AIProviderConfig,
  AppBootstrap,
  CatState,
  KnowledgeGraph,
  NoteDetail,
  NoteSummary,
} from '../types/models';

type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

const storageKey = 'meownotes.local-state.v1';

interface TauriPaths {
  vaultDir?: string;
}

interface TauriBootstrapResponse {
  ready: boolean;
  paths: TauriPaths;
}

interface TauriNoteRecord {
  id: string;
  title: string;
  markdownPath: string;
  updatedAt: string;
}

interface TauriNoteSearchResponse {
  items: Array<{
    note: TauriNoteRecord;
    excerpt: string;
  }>;
}

interface TauriAIChatResponse {
  message: {
    content: string;
  };
}

interface TauriAssetRecord {
  storedPath: string;
}

interface LocalState extends AppBootstrap {
  noteContents: Record<string, string>;
}

function getInvoke(): Invoke | null {
  const maybeWindow = window as unknown as {
    __TAURI_INTERNALS__?: unknown;
    __TAURI__?: {core?: {invoke?: Invoke}; tauri?: {invoke?: Invoke}};
  };

  return maybeWindow.__TAURI__?.core?.invoke ?? maybeWindow.__TAURI__?.tauri?.invoke ?? null;
}

function createLocalState(): LocalState {
  return {
    ...fallbackBootstrap,
    notes: [...fallbackBootstrap.notes],
    providers: [...fallbackBootstrap.providers],
    folders: [...fallbackBootstrap.folders],
    graph: {...fallbackBootstrap.graph},
    cat: {...fallbackBootstrap.cat},
    activeNote: {...fallbackBootstrap.activeNote},
    noteContents: {
      [fallbackBootstrap.activeNote.id]: fallbackBootstrap.activeNote.markdown,
    },
  };
}

function loadLocalState(): LocalState {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return createLocalState();
  }

  try {
    return {...createLocalState(), ...JSON.parse(stored)} as LocalState;
  } catch {
    return createLocalState();
  }
}

function saveLocalState(state: LocalState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getNoteContent(state: LocalState, noteId: string) {
  return state.noteContents[noteId] ?? `# ${state.notes.find((note) => note.id === noteId)?.title ?? '未命名笔记'}\n\n`;
}

function summarizeNote(note: NoteSummary, markdown: string): NoteDetail {
  return {
    ...note,
    markdown,
    wordCount: markdown.replace(/\s+/g, '').length,
    excerpt: markdown
      .replace(/[#>*_`[\]-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80),
  };
}

function noteFromRecord(record: TauriNoteRecord, markdown = '', excerpt = ''): NoteDetail {
  return {
    id: record.id,
    title: record.title,
    folderId: 'articles',
    path: record.markdownPath,
    excerpt: excerpt || markdown.replace(/[#>*_`[\]-]/g, '').trim().slice(0, 80),
    icon: '📄',
    pinned: false,
    updatedAt: record.updatedAt,
    wordCount: markdown.replace(/\s+/g, '').length,
    tags: [],
    markdown,
  };
}

function noteSummaryFromRecord(record: TauriNoteRecord, excerpt = ''): NoteSummary {
  return {
    id: record.id,
    title: record.title,
    folderId: 'articles',
    path: record.markdownPath,
    excerpt,
    icon: '📄',
    pinned: false,
    updatedAt: record.updatedAt,
    wordCount: excerpt.replace(/\s+/g, '').length,
    tags: [],
  };
}

export async function appBootstrap(): Promise<AppBootstrap> {
  const invoke = getInvoke();
  if (invoke) {
    try {
      const boot = await invoke<TauriBootstrapResponse>('app_bootstrap');
      const search = await invoke<TauriNoteSearchResponse>('note_search', {
        request: {query: '', limit: 100},
      });
      const notes = search.items.map((item) => noteSummaryFromRecord(item.note, item.excerpt));
      const activeNote = notes[0]
        ? await invoke<NoteDetail>('note_read', {request: {noteId: notes[0].id}})
        : fallbackBootstrap.activeNote;

      return {
        ...fallbackBootstrap,
        vaultPath: boot.paths.vaultDir ?? fallbackBootstrap.vaultPath,
        notes: notes.length > 0 ? notes : fallbackBootstrap.notes,
        activeNote,
      };
    } catch {
      return fallbackBootstrap;
    }
  }

  const state = loadLocalState();
  const activeNote = summarizeNote(state.activeNote, getNoteContent(state, state.activeNote.id));
  return {...state, activeNote};
}

export async function createNote(title = '未命名笔记', folderId = 'articles'): Promise<NoteDetail> {
  const invoke = getInvoke();
  if (invoke) {
    const record = await invoke<TauriNoteRecord>('note_create', {
      request: {title, folderId, content: `# ${title}\n\n`},
    });
    return noteFromRecord(record, `# ${title}\n\n`, '开始记录新的知识片段。');
  }

  const state = loadLocalState();
  const now = new Date().toISOString();
  const note: NoteDetail = {
    id: `note_${Date.now()}`,
    title,
    folderId,
    path: `02 技术沉淀/技术文章/${title}.md`,
    excerpt: '开始记录新的知识片段。',
    icon: '📄',
    pinned: false,
    updatedAt: now,
    wordCount: title.length,
    tags: [],
    markdown: `# ${title}\n\n`,
  };

  state.notes = [note, ...state.notes];
  state.activeNote = note;
  state.noteContents[note.id] = note.markdown;
  saveLocalState(state);
  return note;
}

export async function loadNote(noteId: string): Promise<NoteDetail> {
  const invoke = getInvoke();
  if (invoke) {
    return invoke<NoteDetail>('note_read', {request: {noteId}});
  }

  const state = loadLocalState();
  const note = state.notes.find((item) => item.id === noteId) ?? state.activeNote;
  return summarizeNote(note, getNoteContent(state, note.id));
}

export async function updateNoteContent(noteId: string, markdown: string): Promise<NoteDetail> {
  const invoke = getInvoke();
  if (invoke) {
    const record = await invoke<TauriNoteRecord>('note_update_content', {
      request: {noteId, markdown},
    });
    return noteFromRecord(record, markdown);
  }

  const state = loadLocalState();
  const note = state.notes.find((item) => item.id === noteId) ?? state.activeNote;
  const updated = summarizeNote({...note, updatedAt: new Date().toISOString()}, markdown);
  state.notes = state.notes.map((item) => (item.id === noteId ? updated : item));
  state.activeNote = updated;
  state.noteContents[noteId] = markdown;
  state.cat = {
    ...state.cat,
    mood: 'happy',
    xp: Math.min(state.cat.nextLevelXp, state.cat.xp + 4),
    message: '我已帮你保存当前笔记，继续写下去喵。',
  };
  saveLocalState(state);
  return updated;
}

export async function searchNotes(keyword: string): Promise<NoteSummary[]> {
  const invoke = getInvoke();
  if (invoke) {
    const response = await invoke<TauriNoteSearchResponse>('note_search', {
      request: {keyword, limit: 100},
    });
    return response.items.map((item) => noteSummaryFromRecord(item.note, item.excerpt));
  }

  const state = loadLocalState();
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return state.notes;
  }

  return state.notes.filter((note) =>
    [note.title, note.excerpt, note.tags.join(' ')].join(' ').toLowerCase().includes(normalized),
  );
}

export async function saveAIProvider(provider: AIProviderConfig): Promise<AIProviderConfig[]> {
  const invoke = getInvoke();
  if (invoke) {
    await invoke('ai_provider_save', {
      request: {
        provider: provider.type,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        model: provider.model,
      },
    });
    const state = loadLocalState();
    const providers = state.providers.map((item) => (item.id === provider.id ? provider : item));
    state.providers = providers;
    saveLocalState(state);
    return providers;
  }

  const state = loadLocalState();
  state.providers = state.providers.map((item) => (item.id === provider.id ? provider : item));
  saveLocalState(state);
  return state.providers;
}

export async function importAsset(sourcePath: string): Promise<string> {
  const invoke = getInvoke();
  if (invoke) {
    const asset = await invoke<TauriAssetRecord>('asset_import', {
      request: {sourcePath},
    });
    return asset.storedPath;
  }

  return sourcePath;
}

export async function runAIAction(action: string, note: NoteDetail, selectedText = ''): Promise<string> {
  const invoke = getInvoke();
  if (invoke) {
    const response = await invoke<TauriAIChatResponse>('ai_chat', {
      request: {
        provider: undefined,
        messages: [
          {
            role: 'user',
            content: `${action}\n\n${selectedText || note.markdown}`,
          },
        ],
      },
    });
    return response.message.content;
  }

  const target = selectedText || note.markdown.slice(0, 600);
  const actionText: Record<string, string> = {
    summarize: '总结当前内容',
    mindmap: '生成思维导图',
    related: '推荐相关笔记',
    explain: '解释选中文本',
  };

  return `喵，我已进入本地演示模式。\n\n动作：${actionText[action] ?? action}\n\n可处理上下文：${target.slice(0, 180)}${
    target.length > 180 ? '...' : ''
  }\n\n配置真实模型后，这里会返回厂商接口的流式结果。`;
}

export async function catInteract(eventType: string, context: Record<string, unknown> = {}): Promise<CatState> {
  const invoke = getInvoke();
  if (invoke) {
    const response = await invoke<{mood: string; energy: number; message: string}>('cat_interact', {
      request: {action: eventType, noteId: typeof context.noteId === 'string' ? context.noteId : undefined},
    });
    return {
      mood: response.mood === 'idle' ? 'idle' : response.energy > 80 ? 'happy' : response.energy < 50 ? 'sleeping' : 'focus',
      level: 6,
      xp: Math.min(1600, 900 + response.energy * 4),
      nextLevelXp: 1600,
      message: response.message,
      focusMinutes: 204,
    };
  }

  const state = loadLocalState();
  const mood = eventType.includes('ai') ? 'thinking' : eventType.includes('focus') ? 'focus' : 'happy';
  state.cat = {
    ...state.cat,
    mood,
    xp: Math.min(state.cat.nextLevelXp, state.cat.xp + 12),
    message: mood === 'thinking' ? '我正在思考你的问题喵。' : '这次互动让我更懂你的知识库了。',
  };
  saveLocalState(state);
  return state.cat;
}

export async function getGraph(noteId?: string): Promise<KnowledgeGraph> {
  const invoke = getInvoke();
  if (invoke) {
    void noteId;
    const graph = await invoke<{nodes: Array<{id: string; label: string}>; edges: Array<{source: string; target: string}>}>('graph_get');
    return {
      nodes: graph.nodes.map((node, index) => ({
        ...node,
        color: ['bg-blue-500', 'bg-purple-400', 'bg-amber-400', 'bg-emerald-400', 'bg-rose-400'][index % 5],
      })),
      edges: graph.edges,
    };
  }

  return loadLocalState().graph;
}
