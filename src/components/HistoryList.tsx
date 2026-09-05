import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Trash2,
  Plus,
  AlertCircle,
  X,
  Sparkles,
  Compass,
} from 'lucide-react';
import { Interaction } from '../types';
import { subscribeUserInteractions, deleteInteraction } from '../firebase/interactions';
import { useAuth } from '../context/AuthContext';

interface HistoryListProps {
  selectedId: string | null;
  onSelectInteraction: (interaction: Interaction) => void;
  onNewSession: () => void;
  onClose?: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  selectedId,
  onSelectInteraction,
  onNewSession,
  onClose,
}) => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setInteractions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeUserInteractions(
      user.uid,
      (data) => {
        setInteractions(data);
        setLoading(false);
      },
      (err) => {
        console.error('History subscribe error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      setDeleteError(null);
      await deleteInteraction(user.uid, id);
      setDeleteConfirmId(null);
      if (selectedId === id) {
        onNewSession();
      }
    } catch (err: any) {
      console.error('Failed to delete interaction:', err);
      setDeleteError('Failed to delete reflection. Check database connection.');
    }
  };

  const filteredInteractions = interactions.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return matchesCategory;

    const inTitle = item.title.toLowerCase().includes(term);
    const inMessages = item.messages.some((m) => m.content.toLowerCase().includes(term));
    const axiomList = item.cognitiveAnalysis?.coreAxioms || (item.cognitiveAnalysis?.coreAxiom ? [item.cognitiveAnalysis.coreAxiom] : []);
    const inAxioms = axiomList.some((a) => a.toLowerCase().includes(term));
    const inResonance = item.cognitiveAnalysis?.emotionalResonance?.some((r) => r.toLowerCase().includes(term));
    const inSocratic = item.cognitiveAnalysis?.socraticQuestions?.some((q) => q.toLowerCase().includes(term));

    const matchesSearch = Boolean(inTitle || inMessages || inAxioms || inResonance || inSocratic);
    return matchesCategory && matchesSearch;
  });

  const handleItemClick = (item: Interaction) => {
    onSelectInteraction(item);
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      id="history-sidebar"
      className="w-full lg:w-80 xl:w-96 flex flex-col h-full bg-[#EFECE6]/70 border-r border-[#E2DDD5] font-serif shrink-0 shadow-lg lg:shadow-none transition-colors"
    >
      {/* Sidebar Header */}
      <div className="p-4 sm:p-5 border-b border-[#E2DDD5] space-y-3.5 bg-[#EFECE6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-sans font-bold uppercase tracking-[0.22em] text-[#2B2A28]">
              Past Entries
            </h2>
            <span className="text-[10px] font-sans text-[#595652] px-1.5 py-0.2 border border-[#E2DDD5] bg-[#FFFDF9] font-medium">
              {filteredInteractions.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="new-entry-sidebar-btn"
              onClick={() => {
                onNewSession();
                if (onClose) onClose();
              }}
              className="p-1.5 border border-[#E2DDD5] hover:border-[#C4432B] text-[#2B2A28] hover:bg-[#C4432B] hover:text-[#F7F4EE] transition-colors rounded-sm"
              title="Create New Entry (⌘N)"
              aria-label="Create New Entry"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 border border-[#E2DDD5] hover:border-[#C4432B] text-[#2B2A28] hover:bg-[#C4432B] hover:text-[#F7F4EE] transition-colors rounded-sm"
                title="Close Entries"
                aria-label="Close Entries"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8A8478]" />
          <input
            id="history-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search past entries..."
            className="w-full pl-8 pr-8 py-1.5 text-xs font-sans bg-[#FFFDF9] border border-[#E2DDD5] focus:outline-none focus:border-[#C4432B] text-[#2B2A28] transition-colors placeholder:text-[#8A8478] rounded-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-[#8A8478] hover:text-[#C4432B]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Tags */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[9px] font-sans uppercase tracking-[0.18em] scrollbar-none">
          {['all', 'reflection', 'brainstorm', 'mindfulness', 'gratitude', 'goals'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-0.5 border whitespace-nowrap transition-colors rounded-xs ${
                categoryFilter === cat
                  ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28] font-semibold'
                  : 'bg-[#FFFDF9] text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {deleteError && (
        <div className="m-3 p-2.5 text-xs font-sans bg-[#C4432B]/10 border border-[#C4432B]/30 text-[#C4432B] flex items-center space-x-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#C4432B]" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Archives Feed */}
      <div id="history-items-container" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs font-sans uppercase tracking-widest text-[#8A8478]">
            Consulting Archives...
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8A8478] space-y-2 font-sans">
            <BookOpen className="w-6 h-6 mx-auto stroke-1 opacity-40 mb-1" />
            <p className="uppercase tracking-widest text-[10px]">No manuscripts found</p>
            <p className="text-[11px] font-serif italic text-[#595652]">
              {searchTerm ? 'Try adjusting your search query or filter.' : 'Record your first inquiry above to begin.'}
            </p>
          </div>
        ) : (
          filteredInteractions.map((item, index) => {
            const isSelected = selectedId === item.id;
            const itemNumber = String(filteredInteractions.length - index).padStart(2, '0');
            const previewSnippet =
              item.messages.find((m) => m.role === 'user')?.content || 'Empty entry';
            const dateObj = new Date(item.updatedAt || item.createdAt);
            const formattedDate = dateObj
              .toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
              })
              .toUpperCase();
            const formattedTime = dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                className={`group cursor-pointer p-4 border transition-all text-left focus:outline-none rounded-xl ${
                  isSelected
                    ? 'bg-[#FFFFFF] border-2 border-[#C4432B] shadow-[0_4px_20px_-2px_rgba(196,67,43,0.12)]'
                    : 'bg-[#FFFFFF]/90 border-[#E2DDD5]/80 hover:border-[#C4432B]/50 hover:bg-[#FFFFFF] hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-sans font-bold text-[#C4432B] bg-[#C4432B]/10 px-1.5 py-0.5 rounded-full">
                      {itemNumber}
                    </span>
                    <span className="text-[10px] font-sans text-[#8A8478] tracking-wider">
                      {formattedDate} · {formattedTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.cognitiveAnalysis && (
                      <span
                        title="Key Insights"
                        className="inline-flex items-center gap-1 text-[8px] font-sans uppercase tracking-wider px-2 py-0.5 bg-[#F7F4EE] text-[#C4432B] border border-[#E2DDD5]/70 rounded-full font-medium"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-[#C4432B]" />
                        <span>Insights</span>
                      </span>
                    )}
                    {item.thinkingMap && (
                      <span
                        title="Idea Map"
                        className="inline-flex items-center gap-1 text-[8px] font-sans uppercase tracking-wider px-2 py-0.5 bg-[#F7F4EE] text-[#2B2A28] border border-[#E2DDD5]/70 rounded-full font-medium"
                      >
                        <Compass className="w-2.5 h-2.5 text-[#C4432B]" />
                        <span>Map</span>
                      </span>
                    )}
                    <span className="text-[8px] font-sans uppercase tracking-wider px-2 py-0.5 border border-[#E2DDD5]/70 text-[#595652] bg-[#F7F4EE] rounded-full">
                      {item.category}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-serif leading-snug text-[#2B2A28] line-clamp-1 mb-1.5 font-normal group-hover:text-[#C4432B] transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs font-serif text-[#595652] line-clamp-2 leading-relaxed italic">
                  {previewSnippet}
                </p>

                <div className="flex items-center justify-between text-[10px] font-sans border-t border-[#E2DDD5]/60 mt-3 pt-2 text-[#8A8478]">
                  <span className="tracking-wider uppercase text-[9px]">
                    {item.messages.length} {item.messages.length === 1 ? 'exchange' : 'exchanges'}
                  </span>

                  {deleteConfirmId === item.id ? (
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="text-[#C4432B] font-bold uppercase tracking-widest text-[9px] border border-[#C4432B] px-1.5 py-0.5 bg-[#C4432B]/10"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className="text-[#8A8478] hover:text-[#2B2A28] uppercase tracking-widest text-[9px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(item.id);
                      }}
                      className="opacity-40 group-hover:opacity-100 p-1 text-[#8A8478] hover:text-[#C4432B] transition-opacity"
                      title="Delete Entry"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3.5 sm:p-4 border-t border-[#E2DDD5] bg-[#EFECE6] flex items-center justify-between text-[10px] font-sans uppercase tracking-[0.18em] text-[#8A8478]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C4432B]"></div>
          <span>Cloud Sync Active</span>
        </div>
        <span>UID Isolated</span>
      </div>
    </aside>
  );
};
