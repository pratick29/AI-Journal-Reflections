import React, { useState, useMemo, useId } from 'react';
import {
  ThinkingMap,
  ThinkingMapNode,
  ThinkingMapEdge,
  ThinkingMapNodeType,
} from '../types';
import {
  Quote,
  Layers,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Compass,
  Sparkles,
  User,
} from 'lucide-react';

interface ThinkingMapViewProps {
  thinkingMap: ThinkingMap;
  onExploreInDialogue: (prompt: string) => void;
  onRegenerate?: () => void;
  isGenerating?: boolean;
}

const NODE_CONFIG: Record<
  ThinkingMapNodeType,
  {
    title: string;
    border: string;
    cardBg: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  central_inquiry: {
    title: 'Central Inquiry',
    border: 'border-2 border-[#2B2A28]',
    cardBg: 'bg-[#FFFDF9]',
    icon: Compass,
  },
  user_premise: {
    title: "Author's Premise",
    border: 'border-2 border-[#C4432B]',
    cardBg: 'bg-[#EFECE6]/80',
    icon: User,
  },
  emerging_theme: {
    title: 'Emerging Theme',
    border: 'border border-[#E2DDD5]',
    cardBg: 'bg-[#FFFDF9]',
    icon: Layers,
  },
  potential_tension: {
    title: 'Potential Tension',
    border: 'border border-[#C4432B]',
    cardBg: 'bg-[#C4432B]/5',
    icon: AlertTriangle,
  },
  possible_assumption: {
    title: 'Possible Assumption',
    border: 'border border-[#E2DDD5]',
    cardBg: 'bg-[#EFECE6]/40',
    icon: HelpCircle,
  },
  constructive_reframe: {
    title: 'Constructive Reframe',
    border: 'border border-[#2B2A28]',
    cardBg: 'bg-[#FFFDF9]',
    icon: Lightbulb,
  },
  open_question: {
    title: 'Open Question',
    border: 'border border-[#C4432B]',
    cardBg: 'bg-[#FFFDF9]',
    icon: Sparkles,
  },
};

const RELATION_LABELS: Record<ThinkingMapEdge['relation'], string> = {
  supports: 'supports',
  conflicts_with: 'tensions with',
  assumes: 'assumes premise',
  reframes: 'reframes',
  leads_to: 'leads to',
};

export const ThinkingMapView: React.FC<ThinkingMapViewProps> = ({
  thinkingMap,
  onExploreInDialogue,
  onRegenerate,
  isGenerating,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    thinkingMap.nodes[0]?.id || null
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'canvas' | 'list'>('canvas');

  const selectedNode = useMemo(
    () => thinkingMap.nodes.find((n) => n.id === selectedNodeId) || null,
    [thinkingMap.nodes, selectedNodeId]
  );

  const layout = useMemo(() => {
    const nodes = thinkingMap.nodes;
    const typeOrder: Record<ThinkingMapNodeType, number> = {
      central_inquiry: 0,
      user_premise: 1,
      emerging_theme: 1,
      potential_tension: 2,
      possible_assumption: 2,
      constructive_reframe: 3,
      open_question: 3,
    };

    const columns: ThinkingMapNode[][] = [[], [], [], []];
    nodes.forEach((node) => {
      const colIdx = typeOrder[node.type] ?? 1;
      columns[colIdx].push(node);
    });

    return columns;
  }, [thinkingMap.nodes]);

  const filteredNodes = useMemo(() => {
    if (filterType === 'all') return thinkingMap.nodes;
    if (filterType === 'author') return thinkingMap.nodes.filter((n) => n.source === 'user_statement');
    if (filterType === 'gemini') return thinkingMap.nodes.filter((n) => n.source === 'gemini_synthesis');
    return thinkingMap.nodes.filter((n) => n.type === filterType);
  }, [thinkingMap.nodes, filterType]);

  return (
    <div id="thinking-map-view" className="space-y-6 font-serif">
      {/* Top Controls Header */}
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xs">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#C4432B]" />
            <span className="text-[10px] font-sans uppercase tracking-[0.22em] font-bold text-[#2B2A28]">
              Reasoning Diagram
            </span>
            <span className="font-script text-[#C4432B] text-lg font-normal">
              topological reasoning sheet...
            </span>
          </div>
          <h3 className="text-xl font-serif font-light text-[#2B2A28] mt-0.5">
            "{thinkingMap.centralTheme}"
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-sans">
          {/* Canvas / List View Toggle */}
          <div className="flex border border-[#E2DDD5] bg-[#EFECE6] p-0.5 text-[10px] uppercase tracking-widest rounded-xs">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-3 py-1 transition-colors ${
                activeTab === 'canvas' ? 'bg-[#2B2A28] text-[#F7F4EE] font-bold' : 'text-[#595652]'
              }`}
            >
              Paper Canvas
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1 transition-colors ${
                activeTab === 'list' ? 'bg-[#2B2A28] text-[#F7F4EE] font-bold' : 'text-[#595652]'
              }`}
            >
              List View
            </button>
          </div>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="text-[10px] uppercase tracking-[0.18em] border border-[#E2DDD5] hover:border-[#C4432B] px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#EFECE6] transition-colors text-[#595652] rounded-xs"
            >
              Re-Synthesize Map
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas + Passage Inspector Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Paper Diagram Sheet (Cols 1-8) */}
        <div className="lg:col-span-8 bg-[#FFFDF9] border border-[#E2DDD5] p-6 sm:p-8 shadow-xs space-y-6 relative min-h-[500px] rounded-xs">
          {/* Header Metadata */}
          <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3 text-[10px] font-sans uppercase tracking-[0.18em] text-[#8A8478]">
            <span>Dialectical Topology · {thinkingMap.nodes.length} Nodes · {thinkingMap.edges.length} Edges</span>
            <span className="text-[#C4432B]">Exploratory Visualization</span>
          </div>

          {activeTab === 'canvas' ? (
            <div className="space-y-8">
              {/* Dialectical Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {layout.map((colNodes, colIdx) => {
                  const stageTitles = [
                    'I. CENTRAL INQUIRY',
                    'II. PREMISES & THEMES',
                    'III. TENSIONS & ASSUMPTIONS',
                    'IV. REFRAMES & QUESTIONS',
                  ];

                  return (
                    <div key={colIdx} className="space-y-4">
                      <div className="border-b border-[#E2DDD5] pb-1">
                        <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold">
                          {stageTitles[colIdx]}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {colNodes.map((node) => {
                          const conf = NODE_CONFIG[node.type];
                          const isSelected = selectedNodeId === node.id;
                          const Icon = conf.icon;

                          return (
                            <div
                              key={node.id}
                              onClick={() => setSelectedNodeId(node.id)}
                              className={`group cursor-pointer p-4 transition-all rounded-xs ${conf.cardBg} ${conf.border} ${
                                isSelected
                                  ? 'ring-2 ring-[#C4432B] shadow-md scale-[1.02]'
                                  : 'hover:border-[#C4432B] hover:shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <span className={`text-[8px] font-sans uppercase tracking-widest px-1.5 py-0.5 border ${
                                  node.source === 'user_statement'
                                    ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28]'
                                    : 'bg-[#EFECE6] text-[#C4432B] border-[#E2DDD5]'
                                } font-semibold`}>
                                  {node.source === 'user_statement' ? 'YOUR WORDS' : 'GEMINI SYNTHESIS'}
                                </span>
                                <Icon className="w-3.5 h-3.5 text-[#8A8478]" />
                              </div>

                              <h4 className="text-sm font-serif font-normal text-[#2B2A28] leading-tight mb-1">
                                {node.label}
                              </h4>
                              <p className="text-xs font-serif text-[#595652] line-clamp-2 leading-relaxed">
                                {node.summary}
                              </p>

                              {node.passageCitations && node.passageCitations.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#E2DDD5] flex items-center gap-1 text-[9px] font-sans text-[#C4432B]">
                                  <Quote className="w-2.5 h-2.5" />
                                  <span>Citation Quote Attached</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edge Relationships Summary */}
              <div className="border-t border-[#E2DDD5] pt-4 space-y-2">
                <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#8A8478] font-bold">
                  DIRECTED RELATIONSHIPS ({thinkingMap.edges.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {thinkingMap.edges.map((edge) => {
                    const src = thinkingMap.nodes.find((n) => n.id === edge.sourceNodeId);
                    const tgt = thinkingMap.nodes.find((n) => n.id === edge.targetNodeId);
                    if (!src || !tgt) return null;

                    return (
                      <span
                        key={edge.id}
                        onClick={() => setSelectedNodeId(src.id)}
                        className="cursor-pointer text-[9px] font-sans px-2 py-1 bg-[#EFECE6] border border-[#E2DDD5] hover:border-[#C4432B] text-[#595652] rounded-xs"
                      >
                        <strong className="text-[#2B2A28]">{src.label}</strong>
                        <span className="text-[#C4432B] mx-1">→ {RELATION_LABELS[edge.relation]} →</span>
                        <strong className="text-[#2B2A28]">{tgt.label}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-4 border transition-all cursor-pointer bg-[#FFFDF9] rounded-xs ${
                    selectedNodeId === node.id ? 'border-2 border-[#C4432B]' : 'border-[#E2DDD5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-sans uppercase tracking-widest font-bold text-[#C4432B]">
                      {node.type.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-sans text-[#8A8478]">
                      {node.source === 'user_statement' ? 'YOUR WORDS' : 'GEMINI SYNTHESIS'}
                    </span>
                  </div>
                  <h4 className="text-base font-serif text-[#2B2A28]">{node.label}</h4>
                  <p className="text-xs font-serif text-[#595652] mt-1">{node.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Manuscript Margin Passage Inspector (Cols 9-12) */}
        <div className="lg:col-span-4 bg-[#FFFDF9] border border-[#E2DDD5] p-6 shadow-xs space-y-6 sticky top-20 rounded-xs">
          <div className="border-b border-[#E2DDD5] pb-3 flex items-center justify-between">
            <span className="text-[10px] font-sans uppercase tracking-[0.22em] text-[#C4432B] font-bold">
              PASSAGE INSPECTOR
            </span>
            {selectedNode && (
              <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478]">
                Node: {selectedNode.id}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-6">
              {/* Selected Node Header */}
              <div>
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478]">
                  SELECTED CONCEPT
                </span>
                <h4 className="text-lg font-serif font-normal text-[#2B2A28] leading-tight mt-0.5">
                  {selectedNode.label}
                </h4>
                <p className="text-xs font-serif text-[#595652] leading-relaxed mt-2">
                  {selectedNode.summary}
                </p>
              </div>

              {/* Verbatim Passage Citations */}
              {selectedNode.passageCitations && selectedNode.passageCitations.length > 0 && (
                <div className="space-y-2 border-t border-[#E2DDD5] pt-4">
                  <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold flex items-center gap-1">
                    <Quote className="w-3 h-3 text-[#C4432B]" />
                    VERBATIM MANUSCRIPT QUOTE
                  </span>
                  {selectedNode.passageCitations.map((quote, idx) => (
                    <div key={idx} className="bg-[#EFECE6]/70 border-l-2 border-[#C4432B] p-3 text-xs font-serif italic text-[#2B2A28] leading-relaxed">
                      "{quote}"
                    </div>
                  ))}
                </div>
              )}

              {/* Epistemic Significance */}
              {selectedNode.significance && (
                <div className="space-y-1.5 border-t border-[#E2DDD5] pt-4">
                  <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#8A8478] font-bold">
                    WHY THIS MATTERS
                  </span>
                  <p className="text-xs font-serif text-[#595652] leading-relaxed">
                    {selectedNode.significance}
                  </p>
                </div>
              )}

              {/* Action Prompt */}
              <div className="pt-4 border-t border-[#E2DDD5]">
                <button
                  onClick={() =>
                    onExploreInDialogue(
                      `Let's explore deeper into "${selectedNode.label}": ${selectedNode.summary}`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-[10px] font-sans uppercase tracking-[0.2em] px-4 py-2.5 transition-all duration-200 font-semibold rounded-sm"
                >
                  <span>Explore in Dialogue →</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-serif text-[#8A8478]">
              Select any node in the diagram to inspect attached manuscript quotes and epistemic significance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
