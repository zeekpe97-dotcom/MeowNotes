export type CatMood = 'idle' | 'happy' | 'thinking' | 'focus' | 'sleeping' | 'error';

export type AIProviderType = 'openai' | 'deepseek' | 'gemini' | 'ollama';

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  count: number;
  children?: FolderNode[];
}

export interface NoteSummary {
  id: string;
  title: string;
  folderId: string;
  path: string;
  excerpt: string;
  icon: string;
  pinned: boolean;
  updatedAt: string;
  wordCount: number;
  tags: string[];
}

export interface NoteDetail extends NoteSummary {
  markdown: string;
}

export interface GraphNode {
  id: string;
  label: string;
  color: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AIProviderConfig {
  id: string;
  type: AIProviderType;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  enabled: boolean;
}

export interface CatState {
  mood: CatMood;
  level: number;
  xp: number;
  nextLevelXp: number;
  message: string;
  focusMinutes: number;
}

export interface AppBootstrap {
  vaultPath: string;
  folders: FolderNode[];
  notes: NoteSummary[];
  activeNote: NoteDetail;
  graph: KnowledgeGraph;
  providers: AIProviderConfig[];
  cat: CatState;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}
