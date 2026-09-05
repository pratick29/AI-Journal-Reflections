import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Compass,
  Download,
  Check,
  Printer,
  BookOpen,
  ArrowRight,
  Clock,
  Quote,
  Layers,
  Plus,
} from 'lucide-react';
import {
  Interaction,
  ChatMessage,
  ReflectionMode,
  CognitiveAnalysis,
  ThinkingMap,
} from '../types';
import { saveInteraction } from '../firebase/interactions';
import { useAuth } from '../context/AuthContext';
import { ThinkingMapView } from './ThinkingMapView';
import { WritingDesk } from './editor/WritingDesk';
import { DialogueStream } from './editor/DialogueStream';
import { CognitiveLensPanel } from './editor/CognitiveLensPanel';
import { EmptyStatePrompts } from './editor/EmptyStatePrompts';

interface JournalEditorProps {
  currentInteraction: Interaction | null;
  onInteractionSaved: (interaction: Interaction) => void;
  onNewSession: () => void;
  onOpenZenMode?: () => void;
  onPinQuote?: (text: string) => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  currentInteraction,
  onInteractionSaved,
  onNewSession,
  onOpenZenMode,
  onPinQuote,
}) => {
  const { user } = useAuth();

  // Active interaction fields
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<Interaction['category']>('reflection');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeMode, setActiveMode] = useState<ReflectionMode>('reflection');
  const [cognitiveAnalysis, setCognitiveAnalysis] = useState<CognitiveAnalysis | null>(null);
  const [thinkingMap, setThinkingMap] = useState<ThinkingMap | null>(null);
  const [activeTab, setActiveTab] = useState<'dialogue' | 'cognitive_lens' | 'thinking_map'>('dialogue');

  // Input & state
  const [promptInput, setPromptInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingUnsavedInteraction, setPendingUnsavedInteraction] = useState<Interaction | null>(null);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const [retryCooldown, setRetryCooldown] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cooldown timer for HTTP 429 rate limit
  useEffect(() => {
    if (retryCooldown <= 0) return;
    const timer = setInterval(() => {
      setRetryCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCooldown]);

  // Sync with current selected interaction
  useEffect(() => {
    if (currentInteraction) {
      setTitle(currentInteraction.title);
      setCategory(currentInteraction.category);
      setMessages(currentInteraction.messages || []);
      setCognitiveAnalysis(currentInteraction.cognitiveAnalysis || null);
      setThinkingMap(currentInteraction.thinkingMap || null);
      setSaveStatus('saved');
      setErrorMessage(null);
      setPendingUnsavedInteraction(null);
      setActiveTab('dialogue');
    } else {
      const now = new Date();
      setTitle(`Inquiry • ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
      setCategory('reflection');
      setMessages([]);
      setCognitiveAnalysis(null);
      setThinkingMap(null);
      setSaveStatus('unsaved');
      setErrorMessage(null);
      setPendingUnsavedInteraction(null);
      setActiveTab('dialogue');
    }
  }, [currentInteraction]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeTab === 'dialogue') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, activeTab]);

  // Commit interaction to Firestore with guaranteed transaction verification
  const commitToFirestore = async (updatedInteraction: Interaction): Promise<boolean> => {
    if (!user) return false;
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await saveInteraction(user.uid, updatedInteraction);
      setSaveStatus('saved');
      setErrorMessage(null);
      setPendingUnsavedInteraction(null);
      onInteractionSaved(updatedInteraction);
      return true;
    } catch (err: any) {
      console.error('Failed to commit interaction to Firestore:', err);
      setSaveStatus('error');
      setPendingUnsavedInteraction(updatedInteraction);
      setErrorMessage(
        'Database write failed. Your reflection and input are preserved in memory. Click "Retry Save" to persist.'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Client-side DAG validation of ThinkingMap graph before rendering/saving
  const validateThinkingMapGraph = (rawMap: any): ThinkingMap | null => {
    if (!rawMap || typeof rawMap !== 'object') return null;
    if (!Array.isArray(rawMap.nodes) || rawMap.nodes.length === 0) return null;

    const validNodeTypes = new Set([
      'central_inquiry',
      'user_premise',
      'emerging_theme',
      'potential_tension',
      'possible_assumption',
      'constructive_reframe',
      'open_question',
    ]);
    const validRelations = new Set(['supports', 'conflicts_with', 'assumes', 'reframes', 'leads_to']);

    const seenNodeIds = new Set<string>();
    const safeNodes: any[] = [];

    for (const n of rawMap.nodes) {
      if (!n || typeof n !== 'object' || !n.id) continue;
      const id = String(n.id).trim();
      if (!id || seenNodeIds.has(id)) continue;
      seenNodeIds.add(id);

      safeNodes.push({
        id,
        type: validNodeTypes.has(n.type) ? n.type : 'emerging_theme',
        source: n.source === 'user_statement' ? 'user_statement' : 'gemini_synthesis',
        label: typeof n.label === 'string' ? n.label.trim().slice(0, 100) : 'Insight',
        summary: typeof n.summary === 'string' ? n.summary.trim().slice(0, 500) : '',
        passageCitations: Array.isArray(n.passageCitations)
          ? n.passageCitations.slice(0, 2).map((c: any) => String(c).slice(0, 300))
          : [],
        messageIndices: Array.isArray(n.messageIndices)
          ? n.messageIndices.filter((idx: any) => typeof idx === 'number' && Number.isInteger(idx) && idx >= 0).slice(0, 4)
          : [],
        significance: typeof n.significance === 'string' ? n.significance.trim().slice(0, 500) : undefined,
      });

      if (safeNodes.length >= 12) break;
    }

    if (safeNodes.length === 0) return null;

    const safeNodeIds = new Set(safeNodes.map((n) => n.id));
    const safeEdges: any[] = [];
    const seenEdges = new Set<string>();
    const clientAdj = new Map<string, string[]>();

    const wouldCreateCycleClient = (src: string, tgt: string): boolean => {
      if (src === tgt) return true;
      const visited = new Set<string>();
      const queue: string[] = [tgt];
      visited.add(tgt);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr === src) return true;
        const neighbors = clientAdj.get(curr);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
      }
      return false;
    };

    if (Array.isArray(rawMap.edges)) {
      for (const e of rawMap.edges) {
        if (!e || typeof e !== 'object') continue;
        const src = String(e.sourceNodeId || '').trim();
        const tgt = String(e.targetNodeId || '').trim();
        if (!src || !tgt) continue;
        if (!safeNodeIds.has(src) || !safeNodeIds.has(tgt)) continue;

        const edgeKey = `${src}->${tgt}`;
        if (seenEdges.has(edgeKey)) continue;

        if (wouldCreateCycleClient(src, tgt)) continue;

        seenEdges.add(edgeKey);
        const currentNeighbors = clientAdj.get(src) || [];
        currentNeighbors.push(tgt);
        clientAdj.set(src, currentNeighbors);

        safeEdges.push({
          id: String(e.id || `edge_${src}_${tgt}`).trim(),
          sourceNodeId: src,
          targetNodeId: tgt,
          relation: validRelations.has(e.relation) ? e.relation : 'supports',
          description: typeof e.description === 'string' ? e.description.trim().slice(0, 150) : undefined,
        });

        if (safeEdges.length >= 16) break;
      }
    }

    return {
      id: String(rawMap.id || `map_${Date.now()}`),
      generatedAt: typeof rawMap.generatedAt === 'number' ? rawMap.generatedAt : Date.now(),
      modelUsed: typeof rawMap.modelUsed === 'string' ? rawMap.modelUsed : 'gemini-3.6-flash',
      centralTheme: typeof rawMap.centralTheme === 'string' ? rawMap.centralTheme.slice(0, 200) : 'Dialectical Inquiry',
      nodes: safeNodes,
      edges: safeEdges,
    };
  };

  // Submit prompt to Gemini API & persist multi-turn interaction
  const handleSubmitPrompt = async (forcedMode?: ReflectionMode, customInput?: string) => {
    const text = (customInput !== undefined ? customInput : promptInput).trim();
    if (!text && forcedMode !== 'cognitive_lens' && forcedMode !== 'thinking_map') return;
    if (!user || isGenerating) return;
    if (retryCooldown > 0) return;

    const userTurnCount = messages.filter((m) => m.role === 'user').length;
    if (userTurnCount >= 15 && forcedMode !== 'cognitive_lens' && forcedMode !== 'thinking_map') {
      setErrorMessage('Dialogue depth limit of 15 inquiries reached. Please distill your reflection using Cognitive Lens or start a new inquiry.');
      return;
    }

    const modeToUse = forcedMode || activeMode;
    const nowIso = new Date().toISOString();
    const interactionId = currentInteraction?.id || `int_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    let newMessagesList = [...messages];
    if (text) {
      const userMessage: ChatMessage = {
        id: `msg_user_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: nowIso,
      };
      newMessagesList = [...messages, userMessage];
      setMessages(newMessagesList);
    }

    setIsGenerating(true);
    setErrorMessage(null);

    const submittedText = text || (messages.length > 0 ? messages[messages.length - 1].content : 'Distill manuscript');

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt: submittedText,
          mode: modeToUse,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        let errorText = `Server responded with status ${response.status}`;
        const retryHeader = response.headers.get('Retry-After');
        let cooldownSec = retryHeader ? parseInt(retryHeader, 10) : 0;

        try {
          const errData = await response.json();
          if (errData.error) {
            errorText = errData.error;
            if (!cooldownSec) {
              const match = errData.error.match(/(\d+)s/i);
              if (match && match[1]) {
                cooldownSec = parseInt(match[1], 10);
              }
            }
          }
        } catch {
          // ignore
        }

        if (response.status === 429 && cooldownSec > 0) {
          setRetryCooldown(cooldownSec);
          errorText = `Rate limit active. Please wait ${cooldownSec}s before submitting again.`;
        }

        throw new Error(errorText);
      }

      const data = await response.json();
      const geminiReply = data.reply || 'No response generated.';
      const modelUsed = data.modelUsed || 'gemini-3.6-flash';

      let updatedAnalysis = cognitiveAnalysis;
      if (modeToUse === 'cognitive_lens' && data.cognitiveAnalysis) {
        updatedAnalysis = data.cognitiveAnalysis;
        setCognitiveAnalysis(updatedAnalysis);
        setActiveTab('cognitive_lens');
      }

      let updatedThinkingMap = thinkingMap;
      if (modeToUse === 'thinking_map' && data.thinkingMap) {
        const validatedMap = validateThinkingMapGraph(data.thinkingMap);
        if (validatedMap) {
          updatedThinkingMap = validatedMap;
          setThinkingMap(updatedThinkingMap);
          setActiveTab('thinking_map');
        }
      }

      let finalMessages = newMessagesList;
      if (modeToUse !== 'cognitive_lens' && modeToUse !== 'thinking_map') {
        const assistantMessage: ChatMessage = {
          id: `msg_asst_${Date.now()}`,
          role: 'assistant',
          content: geminiReply,
          timestamp: new Date().toISOString(),
          modelUsed,
        };
        finalMessages = [...newMessagesList, assistantMessage];
        setMessages(finalMessages);
      }

      let effectiveTitle = title;
      if (messages.length === 0 && (!title || title.startsWith('Inquiry •') || title.startsWith('Reflection •'))) {
        const preview = submittedText.slice(0, 50).replace(/[\r\n]+/g, ' ');
        effectiveTitle = preview.length < submittedText.length ? `${preview}...` : preview;
        setTitle(effectiveTitle);
      }

      const updatedInteraction: Interaction = {
        id: interactionId,
        userId: user.uid,
        title: effectiveTitle,
        category,
        messages: finalMessages,
        cognitiveAnalysis: updatedAnalysis || undefined,
        thinkingMap: updatedThinkingMap || undefined,
        createdAt: currentInteraction?.createdAt || nowIso,
        updatedAt: new Date().toISOString(),
      };

      await commitToFirestore(updatedInteraction);
      if (text) setPromptInput('');
    } catch (err: any) {
      console.error('API Reflection Error:', err);
      setErrorMessage(err.message || 'An error occurred during synthesis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetrySave = async () => {
    if (!pendingUnsavedInteraction) return;
    await commitToFirestore(pendingUnsavedInteraction);
  };

  const handleExportText = () => {
    const textData = `# ${title}\nCategory: ${category}\nCreated: ${currentInteraction?.createdAt || new Date().toISOString()}\n\n` +
      messages.map((m) => `## ${m.role.toUpperCase()} (${m.timestamp})\n${m.content}\n`).join('\n');
    navigator.clipboard.writeText(textData);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handlePrintSpecimen = () => {
    window.print();
  };

  const userTurnCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div id="journal-editor" className="flex-1 flex flex-col h-full overflow-hidden bg-[#FBF9F5]">
      {/* Top Inquiry Banner & Perspective Navigation */}
      <div className="border-b border-[#E5E0D8] px-4 py-3 sm:px-8 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <input
            id="inquiry-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (currentInteraction && title !== currentInteraction.title) {
                commitToFirestore({
                  ...currentInteraction,
                  title: title.trim() || 'Untitled Inquiry',
                  updatedAt: new Date().toISOString(),
                });
              }
            }}
            placeholder="Inquiry Title..."
            className="text-xl sm:text-2xl font-serif font-light text-[#1A1918] bg-transparent border-b border-transparent hover:border-[#E5E0D8] focus:border-[#1A1918] focus:outline-none transition-colors"
          />

          <select
            id="inquiry-category-select"
            value={category}
            onChange={(e) => {
              const newCat = e.target.value as Interaction['category'];
              setCategory(newCat);
              if (currentInteraction) {
                commitToFirestore({
                  ...currentInteraction,
                  category: newCat,
                  updatedAt: new Date().toISOString(),
                });
              }
            }}
            className="text-[10px] font-sans uppercase tracking-[0.18em] border border-[#E5E0D8] bg-[#F4F0E8] text-[#57534E] px-2.5 py-1 focus:outline-none"
          >
            <option value="reflection">Reflection</option>
            <option value="brainstorm">Brainstorm</option>
            <option value="mindfulness">Mindfulness</option>
            <option value="gratitude">Gratitude</option>
            <option value="goals">Goals</option>
          </select>
        </div>

        {/* Perspective Tab Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* Tab Switchers */}
          <div className="flex border border-[#E5E0D8] bg-[#F4F0E8] p-0.5 text-[10px] font-sans uppercase tracking-[0.15em]">
            <button
              onClick={() => setActiveTab('dialogue')}
              className={`px-3 py-1.5 transition-colors ${
                activeTab === 'dialogue'
                  ? 'bg-[#1A1918] text-[#FBF9F5] font-semibold'
                  : 'text-[#57534E] hover:text-[#1A1918]'
              }`}
            >
              Dialogue ({messages.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('cognitive_lens');
                if (!cognitiveAnalysis && messages.length > 0) {
                  handleSubmitPrompt('cognitive_lens');
                }
              }}
              className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${
                activeTab === 'cognitive_lens'
                  ? 'bg-[#1A1918] text-[#FBF9F5] font-semibold'
                  : 'text-[#57534E] hover:text-[#1A1918]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#A94A38]" />
              <span>Lens</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('thinking_map');
                if (!thinkingMap && messages.length > 0) {
                  handleSubmitPrompt('thinking_map');
                }
              }}
              className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${
                activeTab === 'thinking_map'
                  ? 'bg-[#1A1918] text-[#FBF9F5] font-semibold'
                  : 'text-[#57534E] hover:text-[#1A1918]'
              }`}
            >
              <Compass className="w-3 h-3 text-[#A94A38]" />
              <span>Thinking Map</span>
            </button>
          </div>

          {/* Export & Save Status */}
          {messages.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportText}
                className="p-1.5 border border-[#E5E0D8] hover:border-[#1A1918] bg-[#FFFFFF] text-[#57534E] transition-colors"
                title={copiedExport ? "Manuscript copied!" : "Export manuscript to clipboard"}
              >
                {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handlePrintSpecimen}
                className="p-1.5 border border-[#E5E0D8] hover:border-[#1A1918] bg-[#FFFFFF] text-[#57534E] transition-colors"
                title="Print / Export PDF Editorial Specimen"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Save Status Indicator */}
          {saveStatus === 'saving' && (
            <span className="text-[9px] font-sans uppercase tracking-widest text-[#8C857B] flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-[#A94A38]" />
              <span>Saving</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <button
              onClick={handleRetrySave}
              className="text-[9px] font-sans uppercase tracking-widest bg-[#A94A38] text-[#FBF9F5] px-2.5 py-1 flex items-center gap-1 font-bold shadow-xs hover:bg-[#8B3A2B] transition-colors"
              title="Retry saving unsaved state to Firestore"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Notice Banner */}
      {errorMessage && (
        <div className="bg-[#A94A38]/10 border-b border-[#A94A38]/30 px-6 py-2.5 text-xs text-[#A94A38] flex items-center justify-between font-sans">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="underline uppercase text-[9px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Perspective Body View */}
      <div className="flex-1 flex flex-col min-h-0 px-4 py-3 sm:px-12 max-w-4xl mx-auto w-full overflow-hidden">
        {activeTab === 'dialogue' && (
          <div className="flex-1 flex flex-col min-h-0 justify-between gap-3">
            {/* Scrollable Upper Area for Prompts / Dialogue Messages */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4">
              {messages.length === 0 ? (
                <EmptyStatePrompts
                  onSelectPrompt={(question) => {
                    setPromptInput(question);
                    setTimeout(() => {
                      textareaRef.current?.focus();
                    }, 50);
                  }}
                />
              ) : (
                <DialogueStream
                  messages={messages}
                  isGenerating={isGenerating}
                  onPinQuote={onPinQuote}
                  onSelectPassageAction={(action, text) => {
                    if (action === 'challenge') {
                      setPromptInput(`Explore and challenge the underlying assumption in this passage: "${text}"`);
                    } else if (action === 'unpack') {
                      setPromptInput(`Unpack the emotional nuance and philosophical premise behind: "${text}"`);
                    } else if (action === 'marginalia') {
                      setPromptInput(`Add a dialectical perspective to: "${text}"`);
                    }
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Docked Writing Desk Composer at Bottom */}
            <div className="shrink-0 pt-1 pb-1">
              <WritingDesk
                promptInput={promptInput}
                setPromptInput={setPromptInput}
                activeMode={activeMode}
                setActiveMode={setActiveMode}
                isGenerating={isGenerating}
                onSubmitInquiry={(e) => {
                  e.preventDefault();
                  handleSubmitPrompt();
                }}
                userTurnCount={userTurnCount}
                textareaRef={textareaRef}
                onOpenZenMode={onOpenZenMode}
              />
            </div>
          </div>
        )}

        {activeTab === 'cognitive_lens' && (
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <CognitiveLensPanel
              analysis={cognitiveAnalysis}
              onRunAnalysis={() => handleSubmitPrompt('cognitive_lens')}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {activeTab === 'thinking_map' && (
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-4">
            {thinkingMap ? (
              <ThinkingMapView
                thinkingMap={thinkingMap}
                onExploreInDialogue={(prompt) => {
                  setActiveTab('dialogue');
                  setPromptInput(prompt);
                }}
                onRegenerate={() => handleSubmitPrompt('thinking_map')}
                isGenerating={isGenerating}
              />
            ) : (
              <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-12 text-center space-y-6 my-6 rounded-xs">
                <Compass className="w-8 h-8 text-[#C4432B] mx-auto" />
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-2xl font-serif font-light text-[#2B2A28]">
                    Thinking Map Canvas
                  </h3>
                  <p className="text-xs text-[#595652] font-serif">
                    Visualize the topological architecture of your reasoning in a 4-stage directed graph.
                  </p>
                </div>
                <button
                  onClick={() => handleSubmitPrompt('thinking_map')}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-xs font-sans uppercase tracking-[0.2em] px-6 py-3 transition-all duration-200 rounded-sm font-semibold"
                >
                  <Compass className="w-4 h-4" />
                  <span>Synthesize Thinking Map →</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
