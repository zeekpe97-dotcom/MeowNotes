import {FileText, Link2} from 'lucide-react';

export interface WikiLinkCandidate {
  id: string;
  title: string;
  path?: string;
}

interface WikiLinkSuggestProps {
  candidates: WikiLinkCandidate[];
  activeIndex: number;
  onSelect: (candidate: WikiLinkCandidate) => void;
}

export function WikiLinkSuggest({candidates, activeIndex, onSelect}: WikiLinkSuggestProps) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-4 top-14 z-30 w-80 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-blue-50 px-3 py-2 text-xs font-medium text-blue-600">
        <Link2 className="h-3.5 w-3.5" />
        双链候选
      </div>
      <div className="max-h-72 overflow-y-auto p-1">
        {candidates.map((candidate, index) => (
          <button
            key={candidate.id}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(candidate);
            }}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
              index === activeIndex ? 'bg-blue-50 text-blue-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-400">
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{candidate.title}</span>
              {candidate.path && <span className="block truncate text-xs text-slate-400">{candidate.path}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
