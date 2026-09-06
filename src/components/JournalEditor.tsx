import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Bell,
  Palette,
  Calendar,
  History,
  FileText,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  Share2,
  MapPin,
} from 'lucide-react';
import {
  Interaction,
  ChatMessage,
  ReflectionMode,
  CognitiveAnalysis,
  ThinkingMap,
  PhilosophicalPersona,
  AuthorProfile,
  JournalLocation,
  AudioMemo,
} from '../types';
import { saveInteraction } from '../firebase/interactions';
import { useAuth } from '../context/AuthContext';
import { ThinkingMapView } from './ThinkingMapView';
import { WritingDesk } from './editor/WritingDesk';
import { DialogueStream } from './editor/DialogueStream';
import { CognitiveLensPanel } from './editor/CognitiveLensPanel';
import { EmptyStatePrompts } from './editor/EmptyStatePrompts';
import { JournalLocationPicker } from './maps/JournalLocationPicker';
import { AudioMemoPlayer } from './editor/AudioMemoPlayer';
import { PassphraseModal } from './security/PassphraseModal';
import {
  encryptPayload,
  decryptPayload,
  getSessionPassphrase,
  setSessionPassphrase,
} from '../utils/crypto';
import { exportToGoogleDocs } from '../utils/googleDrive';
import { enqueueOfflineSync, flushOfflineQueue, cacheInteractionOffline } from '../utils/offlineSync';

interface JournalEditorProps {
  currentInteraction: Interaction | null;
  onInteractionSaved: (interaction: Interaction) => void;
  onNewSession: () => void;
  onOpenZenMode?: () => void;
  onPinQuote?: (text: string) => void;
  thoughtGrammarEnabled?: boolean;
  authorProfile?: AuthorProfile;
  onOpenNotifications?: () => void;
  allInteractions?: Interaction[];
  onSelectInteraction?: (interaction: Interaction) => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  currentInteraction,
  onInteractionSaved,
  onNewSession,
  onOpenZenMode,
  onPinQuote,
  thoughtGrammarEnabled = true,
  authorProfile,
  onOpenNotifications,
  allInteractions = [],
  onSelectInteraction,
}) => {
  const { user } = useAuth();

  // Active interaction fields
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<Interaction['category']>('reflection');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeMode, setActiveMode] = useState<ReflectionMode>('reflection');
  const [selectedPersona, setSelectedPersona] = useState<PhilosophicalPersona>('default');
  const [cognitiveAnalysis, setCognitiveAnalysis] = useState<CognitiveAnalysis | null>(null);
  const [thinkingMap, setThinkingMap] = useState<ThinkingMap | null>(null);
  const [activeTab, setActiveTab] = useState<'dialogue' | 'cognitive_lens' | 'thinking_map' | 'woodcut'>('dialogue');

  // Input & state
  const [promptInput, setPromptInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingUnsavedInteraction, setPendingUnsavedInteraction] = useState<Interaction | null>(null);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const [retryCooldown, setRetryCooldown] = useState<number>(0);
  const [location, setLocation] = useState<JournalLocation | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState<boolean>(false);
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string; name?: string } | null>(null);
  const [illuminatedArtUrl, setIlluminatedArtUrl] = useState<string | null>(null);
  const [isGeneratingArt, setIsGeneratingArt] = useState<boolean>(false);

  // End-to-End Encryption & Audio Voice Memo states
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isDecryptedUnlocked, setIsDecryptedUnlocked] = useState<boolean>(true);
  const [audioMemo, setAudioMemo] = useState<AudioMemo | null>(null);
  const [showPassphraseModal, setShowPassphraseModal] = useState<boolean>(false);
  const [passphraseModalMode, setPassphraseModalMode] = useState<'setup' | 'unlock'>('setup');
  const [manualPassphraseInput, setManualPassphraseInput] = useState<string>('');
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

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
    let isCancelled = false;

    const syncInteraction = async () => {
      if (currentInteraction) {
        setTitle(currentInteraction.title);
        setCategory(currentInteraction.category);
        setLocation(currentInteraction.location || null);
        setIlluminatedArtUrl(currentInteraction.illuminatedArtUrl || null);
        setSaveStatus('saved');
        setErrorMessage(null);
        setPendingUnsavedInteraction(null);
        setActiveTab('dialogue');

        if (currentInteraction.isEncrypted && currentInteraction.encryptedPayload) {
          setIsEncrypted(true);
          const cachedPass = getSessionPassphrase();
          if (cachedPass) {
            try {
              const decrypted = await decryptPayload<any>(currentInteraction.encryptedPayload, cachedPass);
              if (!isCancelled) {
                setMessages(decrypted.messages || []);
                setCognitiveAnalysis(decrypted.cognitiveAnalysis || null);
                setThinkingMap(decrypted.thinkingMap || null);
                setAudioMemo(decrypted.audioMemo || null);
                setIsDecryptedUnlocked(true);
                setDecryptError(null);
              }
            } catch {
              if (!isCancelled) {
                setMessages([]);
                setCognitiveAnalysis(null);
                setThinkingMap(null);
                setAudioMemo(null);
                setIsDecryptedUnlocked(false);
              }
            }
          } else {
            if (!isCancelled) {
              setMessages([]);
              setCognitiveAnalysis(null);
              setThinkingMap(null);
              setAudioMemo(null);
              setIsDecryptedUnlocked(false);
            }
          }
        } else {
          setIsEncrypted(false);
          setIsDecryptedUnlocked(true);
          setMessages(currentInteraction.messages || []);
          setCognitiveAnalysis(currentInteraction.cognitiveAnalysis || null);
          setThinkingMap(currentInteraction.thinkingMap || null);
          setAudioMemo(currentInteraction.audioMemo || null);
        }
      } else {
        const now = new Date();
        setTitle(`Inquiry • ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
        setCategory('reflection');
        setMessages([]);
        if (authorProfile?.defaultInterlocutor) {
          setSelectedPersona(authorProfile.defaultInterlocutor);
        }
        setCognitiveAnalysis(null);
        setThinkingMap(null);
        setLocation(null);
        setAttachedImage(null);
        setIlluminatedArtUrl(null);
        setAudioMemo(null);
        setIsEncrypted(false);
        setIsDecryptedUnlocked(true);
        setSaveStatus('unsaved');
        setErrorMessage(null);
        setPendingUnsavedInteraction(null);
        setActiveTab('dialogue');
      }
    };

    syncInteraction();

    return () => {
      isCancelled = true;
    };
  }, [currentInteraction]);

  // Dismiss Export dropdown on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const handleManualUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualPassphraseInput.trim() || !currentInteraction?.encryptedPayload) return;

    setIsDecrypting(true);
    setDecryptError(null);
    try {
      const decrypted = await decryptPayload<any>(
        currentInteraction.encryptedPayload,
        manualPassphraseInput.trim()
      );
      setSessionPassphrase(manualPassphraseInput.trim());
      setMessages(decrypted.messages || []);
      setCognitiveAnalysis(decrypted.cognitiveAnalysis || null);
      setThinkingMap(decrypted.thinkingMap || null);
      setAudioMemo(decrypted.audioMemo || null);
      setIsDecryptedUnlocked(true);
      setManualPassphraseInput('');
    } catch (err: any) {
      setDecryptError(err?.message || 'Incorrect passphrase. Please verify and try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleToggleEncryption = () => {
    if (isEncrypted) {
      setIsEncrypted(false);
    } else {
      const cached = getSessionPassphrase();
      if (cached) {
        setIsEncrypted(true);
      } else {
        setPassphraseModalMode('setup');
        setShowPassphraseModal(true);
      }
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeTab === 'dialogue') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, activeTab]);

  // "On This Day" Time Travel Memory calculation
  const pastMemory = useMemo(() => {
    if (!allInteractions || allInteractions.length === 0) return null;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    // 1. Look for an entry created on the exact calendar day in a previous month or year
    const exactDayMatch = allInteractions.find((item) => {
      if (!item.createdAt || item.id === currentInteraction?.id) return false;
      const d = new Date(item.createdAt);
      const daysDiff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return d.getDate() === currentDate && daysDiff >= 3;
    });

    if (exactDayMatch) return exactDayMatch;

    // 2. Fallback to an insightful past entry written at least 3 days ago
    const olderEntries = allInteractions.filter((item) => {
      if (!item.createdAt || item.id === currentInteraction?.id) return false;
      const diffDays = (now.getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 3 && item.messages && item.messages.length > 0;
    });

    if (olderEntries.length > 0) {
      // Return a random older entry to keep it fresh
      return olderEntries[Math.floor(Math.random() * olderEntries.length)];
    }

    return null;
  }, [allInteractions, currentInteraction]);

  const timeAgoText = useMemo(() => {
    if (!pastMemory?.createdAt) return '';
    const d = new Date(pastMemory.createdAt);
    const diffMs = Date.now() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    if (diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    return `${diffDays} days ago`;
  }, [pastMemory]);

  const pastSnippet = useMemo(() => {
    if (!pastMemory) return '';
    if (pastMemory.summary) return pastMemory.summary;
    const firstUserMsg = pastMemory.messages?.find((m) => m.role === 'user');
    return firstUserMsg?.content || '';
  }, [pastMemory]);

  // Commit interaction to Firestore with guaranteed transaction verification & offline sync queue
  const commitToFirestore = async (updatedInteraction: Interaction): Promise<boolean> => {
    if (!user) return false;
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      let interactionToSave = { ...updatedInteraction };

      if (isEncrypted) {
        const pass = getSessionPassphrase();
        if (!pass) {
          setPendingUnsavedInteraction(updatedInteraction);
          setPassphraseModalMode('setup');
          setShowPassphraseModal(true);
          setIsSaving(false);
          setSaveStatus('unsaved');
          return false;
        }

        const sensitivePayload = {
          messages: updatedInteraction.messages,
          cognitiveAnalysis: updatedInteraction.cognitiveAnalysis,
          thinkingMap: updatedInteraction.thinkingMap,
          audioMemo: updatedInteraction.audioMemo,
        };

        const encryptedPayload = await encryptPayload(sensitivePayload, pass);
        interactionToSave = {
          ...updatedInteraction,
          isEncrypted: true,
          encryptedPayload,
          messages: [], // Zero-Knowledge: no plaintext messages stored on Firestore
          cognitiveAnalysis: undefined,
          thinkingMap: undefined,
          audioMemo: undefined,
        };
      }

      // Check if user is offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await enqueueOfflineSync(user.uid, interactionToSave);
        setSaveStatus('saved');
        setErrorMessage(null);
        setPendingUnsavedInteraction(null);
        onInteractionSaved(updatedInteraction);
        return true;
      }

      try {
        await saveInteraction(user.uid, interactionToSave);
        setSaveStatus('saved');
        setErrorMessage(null);
        setPendingUnsavedInteraction(null);
        onInteractionSaved(updatedInteraction);
        return true;
      } catch (networkErr) {
        console.warn('Network error while persisting to Firestore; queuing for background sync:', networkErr);
        await enqueueOfflineSync(user.uid, interactionToSave);
        setSaveStatus('saved');
        setErrorMessage(null);
        setPendingUnsavedInteraction(null);
        onInteractionSaved(updatedInteraction);
        return true;
      }
    } catch (err: any) {
      console.error('Failed to commit interaction:', err);
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

  // Auto-flush offline sync queue when connectivity is restored
  useEffect(() => {
    if (!user) return;
    const handleOnline = async () => {
      try {
        await flushOfflineQueue(user.uid, async (interaction) => {
          await saveInteraction(user.uid, interaction);
        });
      } catch (err) {
        console.warn('Auto-flush offline queue error:', err);
      }
    };

    window.addEventListener('online', handleOnline);
    // Also attempt flush on initial mount if online
    if (navigator.onLine) {
      handleOnline();
    }
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

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
        imageUrl: attachedImage?.data,
        imageMimeType: attachedImage?.mimeType,
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
          persona: selectedPersona,
          creed: authorProfile?.creed,
          socraticTone: authorProfile?.socraticTone,
          location: location
            ? {
                name: location.name,
                lat: location.lat,
                lng: location.lng,
                address: location.address,
                weather: location.weather,
              }
            : undefined,
          image: attachedImage
            ? {
                data: attachedImage.data,
                mimeType: attachedImage.mimeType,
              }
            : undefined,
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
          // Fallback to HTTP status text
        }

        if (response.status === 429) {
          const finalCooldown = cooldownSec > 0 ? cooldownSec : 30;
          setRetryCooldown(finalCooldown);
          throw new Error(`Manuscript pace limit reached. The Socratic guide requires contemplation. Please wait ${finalCooldown}s.`);
        }

        throw new Error(errorText);
      }

      const data = await response.json();

      let assistantMessage: ChatMessage;
      let updatedAnalysis = cognitiveAnalysis;
      let updatedThinkingMap = thinkingMap;

      if (modeToUse === 'cognitive_lens') {
        const lensAnalysis: CognitiveAnalysis = data.cognitiveAnalysis;
        updatedAnalysis = lensAnalysis;
        setCognitiveAnalysis(lensAnalysis);

        assistantMessage = {
          id: `lens_${Date.now()}`,
          role: 'assistant',
          content: `**Cognitive Axiom:** ${lensAnalysis.coreAxiom}\n\n**Emotional Resonance:** ${lensAnalysis.emotionalResonance.join(', ')}\n\n**Unexamined Premises:**\n${lensAnalysis.cognitiveBlindspots.map((b) => `• ${b}`).join('\n')}\n\n**Socratic Inquiries:**\n${lensAnalysis.socraticQuestions.map((q) => `• ${q}`).join('\n')}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.modelUsed,
        };
        newMessagesList = [...newMessagesList, assistantMessage];
        setMessages(newMessagesList);
      } else if (modeToUse === 'thinking_map') {
        const mapData = validateThinkingMapGraph(data.thinkingMap);
        if (mapData) {
          updatedThinkingMap = mapData;
          setThinkingMap(mapData);
          setActiveTab('thinking_map');

          assistantMessage = {
            id: `map_${Date.now()}`,
            role: 'assistant',
            content: `**Thinking Map Synthesis Generated:** "${mapData.centralTheme}"\n\nSynthesized **${mapData.nodes.length} dialectical nodes** and **${mapData.edges.length} reasoning vectors**. Explore the structural topology in the **Thinking Map** tab.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: data.modelUsed,
          };
          newMessagesList = [...newMessagesList, assistantMessage];
          setMessages(newMessagesList);
        } else {
          throw new Error('Received malformed reasoning topology. Please retry.');
        }
      } else {
        assistantMessage = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Silence in the manuscript.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.modelUsed,
        };
        newMessagesList = [...newMessagesList, assistantMessage];
        setMessages(newMessagesList);
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
        messages: newMessagesList,
        cognitiveAnalysis: updatedAnalysis || undefined,
        thinkingMap: updatedThinkingMap || undefined,
        location: location || undefined,
        illuminatedArtUrl: illuminatedArtUrl || undefined,
        audioMemo: audioMemo || undefined,
        isEncrypted: isEncrypted || undefined,
        createdAt: currentInteraction?.createdAt || nowIso,
        updatedAt: new Date().toISOString(),
      };

      await commitToFirestore(updatedInteraction);
      if (text) setPromptInput('');
      setAttachedImage(null);
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
    const authorLine = authorProfile?.penName ? `Author: ${authorProfile.penName}\n` : '';
    const locLine = location ? `Locus: ${location.name}${location.address ? ` (${location.address})` : ''}\n` : '';
    const textData = `# ${title}\n${authorLine}${locLine}Category: ${category}\nCreated: ${currentInteraction?.createdAt || new Date().toISOString()}\n\n` +
      messages.map((m) => `## ${m.role.toUpperCase()} (${m.timestamp})\n${m.content}\n`).join('\n');
    navigator.clipboard.writeText(textData);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleExportMarkdown = () => {
    const dateIso = currentInteraction?.createdAt || new Date().toISOString();
    const cleanDate = dateIso.split('T')[0];
    const tagsList = [category, 'personal-journal'];
    if (selectedPersona && selectedPersona !== 'default') tagsList.push(selectedPersona);

    let frontmatter = `---\n`;
    frontmatter += `title: "${title.replace(/"/g, '\\"')}"\n`;
    frontmatter += `date: ${cleanDate}\n`;
    frontmatter += `category: ${category}\n`;
    frontmatter += `tags: [${tagsList.map(t => `"${t}"`).join(', ')}]\n`;
    if (authorProfile?.penName) frontmatter += `author: "${authorProfile.penName}"\n`;
    if (location) {
      frontmatter += `location: "${location.name}"\n`;
      if (location.weather) frontmatter += `weather: "${location.weather.tempC}°C, ${location.weather.condition}"\n`;
    }
    if (cognitiveAnalysis?.coreAxiom) {
      frontmatter += `key_takeaway: "${cognitiveAnalysis.coreAxiom.replace(/"/g, '\\"')}"\n`;
    }
    frontmatter += `---\n\n`;

    let body = `# ${title}\n\n`;
    if (cognitiveAnalysis?.coreAxiom) {
      body += `> 💡 **Main Takeaway**: ${cognitiveAnalysis.coreAxiom}\n\n`;
    }

    body += messages.map((m) => {
      const speaker = m.role === 'user' ? (authorProfile?.penName || 'Author') : 'Gemini Mentor';
      return `### ${speaker} · ${m.timestamp}\n\n${m.content}\n`;
    }).join('\n---\n\n');

    const fullContent = frontmatter + body;
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeFilename = title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'journal_entry';
    link.href = url;
    link.download = `${cleanDate}_${safeFilename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintSpecimen = () => {
    window.print();
  };

  const handleExportGoogleDocs = async () => {
    if (!currentInteraction && messages.length === 0) return;
    const itemToExport: Interaction = currentInteraction || {
      id: 'temp_doc',
      userId: user?.uid || 'anonymous_author',
      title: title.trim() || 'MindScribe Reflection',
      category,
      messages,
      cognitiveAnalysis,
      thinkingMap,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location,
    };
    await exportToGoogleDocs(itemToExport, authorProfile?.penName);
  };

  const userTurnCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div id="journal-editor" className="flex-1 flex flex-col h-full overflow-hidden bg-[#FBF9F5] dark:bg-[#131211]">
      {/* Top Inquiry Banner & Perspective Navigation */}
      <div className="border-b border-[#E5E0D8] dark:border-[#2C2824] px-4 sm:px-8 lg:px-12 bg-[#FFFFFF] dark:bg-[#181614] shrink-0">
        <div className="max-w-5xl xl:max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
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
            className="text-xl sm:text-2xl font-serif font-light text-[#1A1918] dark:text-[#F5F2EB] bg-transparent border-b border-transparent hover:border-[#E5E0D8] dark:hover:border-[#38332D] focus:border-[#1A1918] dark:focus:border-[#C4432B] focus:outline-none transition-colors"
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
            className="text-[10px] font-sans uppercase tracking-[0.16em] border border-[#E5E0D8] dark:border-[#38332D] bg-[#F4F0E8]/70 dark:bg-[#25221E] hover:bg-[#F4F0E8] hover:dark:bg-[#2D2823] text-[#57534E] dark:text-[#C8C2B5] px-3 py-1 rounded-full focus:outline-none transition-colors shadow-2xs cursor-pointer"
          >
            <option value="reflection" className="dark:bg-[#1C1A18] dark:text-[#F5F2EB]">Reflection</option>
            <option value="brainstorm" className="dark:bg-[#1C1A18] dark:text-[#F5F2EB]">Brainstorm</option>
            <option value="mindfulness" className="dark:bg-[#1C1A18] dark:text-[#F5F2EB]">Mindfulness</option>
            <option value="gratitude" className="dark:bg-[#1C1A18] dark:text-[#F5F2EB]">Gratitude</option>
            <option value="goals" className="dark:bg-[#1C1A18] dark:text-[#F5F2EB]">Goals</option>
          </select>
        </div>

        {/* Perspective Tab Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Switchers */}
          <div className="flex border border-[#E5E0D8] dark:border-[#38332D] bg-[#F4F0E8]/70 dark:bg-[#25221E] p-1 rounded-full text-[10px] font-sans uppercase tracking-[0.15em] shadow-2xs">
            <button
              onClick={() => setActiveTab('dialogue')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeTab === 'dialogue'
                  ? 'bg-[#1A1918] text-[#FBF9F5] dark:bg-[#C4432B] dark:text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#57534E] dark:text-[#A8A196] hover:text-[#1A1918] hover:dark:text-[#F5F2EB]'
              }`}
            >
              Conversation ({messages.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('cognitive_lens');
                if (!cognitiveAnalysis && messages.length > 0) {
                  handleSubmitPrompt('cognitive_lens');
                }
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'cognitive_lens'
                  ? 'bg-[#1A1918] text-[#FBF9F5] dark:bg-[#C4432B] dark:text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#57534E] dark:text-[#A8A196] hover:text-[#1A1918] hover:dark:text-[#F5F2EB]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#A94A38] dark:text-[#FF8A73]" />
              <span className="hidden sm:inline">Key Insights</span>
              <span className="sm:hidden">Insights</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('thinking_map');
                if (!thinkingMap && messages.length > 0) {
                  handleSubmitPrompt('thinking_map');
                }
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'thinking_map'
                  ? 'bg-[#1A1918] text-[#FBF9F5] dark:bg-[#C4432B] dark:text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#57534E] dark:text-[#A8A196] hover:text-[#1A1918] hover:dark:text-[#F5F2EB]'
              }`}
            >
              <Compass className="w-3 h-3 text-[#A94A38] dark:text-[#FF8A73]" />
              <span className="hidden sm:inline">Idea Map</span>
              <span className="sm:hidden">Map</span>
            </button>
            <button
              onClick={() => setActiveTab('woodcut')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'woodcut'
                  ? 'bg-[#1A1918] text-[#FBF9F5] dark:bg-[#C4432B] dark:text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#57534E] dark:text-[#A8A196] hover:text-[#1A1918] hover:dark:text-[#F5F2EB]'
              }`}
            >
              <Palette className="w-3 h-3 text-[#A94A38] dark:text-[#FF8A73]" />
              <span className="hidden sm:inline">Entry Art</span>
              <span className="sm:hidden">Art</span>
            </button>
          </div>

          {/* Locus Pin Button (Google Maps & Places API) */}
          <button
            type="button"
            onClick={() => setIsLocationPickerOpen(true)}
            className={`px-3 py-1.5 border transition-all flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-wider rounded-full shadow-2xs cursor-pointer ${
              location
                ? 'bg-[#C4432B]/10 text-[#C4432B] border-[#C4432B]/50 font-medium'
                : 'bg-[#FFFFFF] dark:bg-[#25221E] text-[#57534E] dark:text-[#C8C2B5] border-[#E5E0D8] dark:border-[#38332D] hover:border-[#C4432B] hover:text-[#2B2A28] dark:hover:text-[#FFFFFF]'
            }`}
            title={location ? `Locus: ${location.name}${location.weather ? ` (${location.weather.tempC}°C, ${location.weather.condition})` : ''}` : 'Inscribe Locus via Google Maps & Places API'}
          >
            <MapPin className="w-3 h-3 text-[#C4432B]" />
            <span className="truncate max-w-[110px]">{location ? location.name : 'Locus'}</span>
            {location?.weather && (
              <span className="font-sans text-[9px] text-[#8A8478] dark:text-[#8E877C] hidden sm:inline border-l border-[#E2DDD5] dark:border-[#38332D] pl-1 ml-0.5">
                {location.weather.tempC}°C
              </span>
            )}
          </button>

          {/* Compact Editorial Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className={`px-3 py-1.5 border transition-all flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-wider rounded-full shadow-2xs cursor-pointer ${
                showExportMenu
                  ? 'bg-[#1A1918] text-[#FBF9F5] border-[#1A1918] dark:bg-[#C4432B] dark:text-[#FFFFFF] dark:border-[#C4432B]'
                  : 'bg-[#FFFFFF] dark:bg-[#25221E] text-[#57534E] dark:text-[#C8C2B5] border-[#E5E0D8] dark:border-[#38332D] hover:border-[#1A1918] hover:text-[#1A1918] dark:hover:border-[#C4432B] dark:hover:text-[#F5F2EB]'
              }`}
              title="Export, download, or share manuscript"
            >
              <Share2 className="w-3 h-3 text-[#A94A38] dark:text-[#FF8A73]" />
              <span className="font-medium">Export</span>
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Popover */}
            {showExportMenu && (
              <div className="absolute right-0 sm:right-auto sm:left-0 mt-1.5 w-60 bg-[#FFFFFF] dark:bg-[#201D1A] border border-[#E2DDD5] dark:border-[#38332D] rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 font-sans">
                <div className="px-3.5 py-1.5 border-b border-[#E2DDD5]/50 dark:border-[#38332D]/50 text-[9px] uppercase tracking-widest font-semibold text-[#8C857B]">
                  Export Manuscript
                </div>

                {/* Google Docs */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportGoogleDocs();
                    setShowExportMenu(false);
                  }}
                  disabled={messages.length === 0}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-xs text-[#2B2A28] dark:text-[#F5F2EB] hover:bg-[#F7F4EE] hover:dark:bg-[#2A2622] transition-colors disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#4285F4]/10 text-[#4285F4] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center justify-between">
                      <span>Google Docs</span>
                      <span className="text-[9px] text-[#4285F4] font-semibold uppercase tracking-wider">1-Click</span>
                    </div>
                    <p className="text-[10px] text-[#8C857B] truncate">Open new doc & auto-format with Ctrl+V</p>
                  </div>
                </button>

                {/* Markdown (.MD) */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportMarkdown();
                    setShowExportMenu(false);
                  }}
                  disabled={messages.length === 0}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-xs text-[#2B2A28] dark:text-[#F5F2EB] hover:bg-[#F7F4EE] hover:dark:bg-[#2A2622] transition-colors disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                    MD
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">Markdown (.md)</div>
                    <p className="text-[10px] text-[#8C857B] truncate">Download for Obsidian, Notion & Logseq</p>
                  </div>
                </button>

                {/* Print / PDF */}
                <button
                  type="button"
                  onClick={() => {
                    handlePrintSpecimen();
                    setShowExportMenu(false);
                  }}
                  disabled={messages.length === 0}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-xs text-[#2B2A28] dark:text-[#F5F2EB] hover:bg-[#F7F4EE] hover:dark:bg-[#2A2622] transition-colors disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1A1918]/5 dark:bg-white/5 text-[#57534E] dark:text-[#C8C2B5] flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">Print / Export PDF</div>
                    <p className="text-[10px] text-[#8C857B] truncate">Typeset specimen layout for physical print</p>
                  </div>
                </button>

                {/* Copy Text */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportText();
                    setShowExportMenu(false);
                  }}
                  disabled={messages.length === 0}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-xs text-[#2B2A28] dark:text-[#F5F2EB] hover:bg-[#F7F4EE] hover:dark:bg-[#2A2622] transition-colors disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1A1918]/5 dark:bg-white/5 text-[#57534E] dark:text-[#C8C2B5] flex items-center justify-center shrink-0">
                    {copiedExport ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{copiedExport ? 'Copied to Clipboard!' : 'Copy Raw Text'}</div>
                    <p className="text-[10px] text-[#8C857B] truncate">Copy full dialogue turns to clipboard</p>
                  </div>
                </button>

                {/* Webhooks / Slack / Discord */}
                {onOpenNotifications && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenNotifications();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-xs text-[#2B2A28] dark:text-[#F5F2EB] hover:bg-[#F7F4EE] hover:dark:bg-[#2A2622] transition-colors border-t border-[#E2DDD5]/50 dark:border-[#38332D]/50 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#C4432B]/10 text-[#C4432B] flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">Webhooks & Alerts</div>
                      <p className="text-[10px] text-[#8C857B] truncate">Send to Discord, Slack or custom endpoint</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

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
      <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-8 lg:px-12 py-3.5 max-w-5xl xl:max-w-6xl mx-auto w-full overflow-hidden">
        {activeTab === 'dialogue' && (
          <div className="flex-1 flex flex-col min-h-0 justify-between gap-3">
            {/* Scrollable Upper Area for Prompts / Dialogue Messages */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4">
              {isEncrypted && !isDecryptedUnlocked ? (
                <div className="max-w-md mx-auto my-auto py-12 px-6 bg-[#FFFFFF] dark:bg-[#201D1A] border border-[#E2DDD5] dark:border-[#38332D] rounded-2xl shadow-xl text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-medium text-[#2B2A28] dark:text-[#F5F2EB]">
                      Sanctuary Vault Locked
                    </h3>
                    <p className="text-xs text-[#8A8478] dark:text-[#8E877C] mt-1 max-w-xs mx-auto leading-relaxed">
                      This reflection is secured with Zero-Knowledge AES-GCM 256-bit encryption. Enter your passphrase to decrypt and read.
                    </p>
                  </div>

                  {decryptError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-300">
                      {decryptError}
                    </div>
                  )}

                  <form onSubmit={handleManualUnlock} className="space-y-3 pt-2">
                    <input
                      type="password"
                      value={manualPassphraseInput}
                      onChange={(e) => setManualPassphraseInput(e.target.value)}
                      placeholder="Enter passphrase..."
                      className="w-full px-3.5 py-2.5 bg-[#FFFDF9] dark:bg-[#181614] border border-[#E2DDD5] dark:border-[#38332D] rounded-xl text-sm text-[#2B2A28] dark:text-[#F5F2EB] placeholder-stone-400 focus:outline-none focus:border-[#C4432B] text-center"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isDecrypting || !manualPassphraseInput.trim()}
                      className="w-full py-2.5 px-4 bg-[#C4432B] hover:bg-[#A93822] text-white text-sm font-medium rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isDecrypting ? 'Decrypting...' : 'Unlock Sanctuary Entry'}
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {audioMemo && (
                    <div className="max-w-2xl mx-auto mb-3">
                      <AudioMemoPlayer
                        audioMemo={audioMemo}
                        onDelete={() => {
                          setAudioMemo(null);
                          if (currentInteraction) {
                            commitToFirestore({
                              ...currentInteraction,
                              audioMemo: undefined,
                              updatedAt: new Date().toISOString(),
                            });
                          }
                        }}
                      />
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="space-y-6">
                      {pastMemory && (
                        <div className="p-5 rounded-2xl border border-[#D97706]/35 bg-gradient-to-br from-[#FFFDF7] via-[#FFFBEB] to-[#FDF8EE] shadow-[0_4px_24px_-4px_rgba(217,119,6,0.08),0_1px_3px_0_rgba(43,42,40,0.02)] relative overflow-hidden transition-all hover:border-[#D97706]/60 hover:shadow-[0_8px_30px_-4px_rgba(217,119,6,0.12)]">
                          <div className="flex items-center justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-2 text-xs font-sans font-semibold tracking-wider uppercase text-[#B45309]">
                              <div className="w-6 h-6 rounded-full bg-[#D97706]/10 flex items-center justify-center">
                                <History className="w-3.5 h-3.5 text-[#D97706]" />
                              </div>
                              <span>On This Day · {timeAgoText}</span>
                            </div>
                            <span className="text-[11px] font-sans text-[#8C857B] bg-[#FFFFFF]/80 px-2.5 py-0.5 rounded-full border border-[#D97706]/20">
                              {new Date(pastMemory.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <h4 className="font-serif text-base font-medium text-[#2C2825] mb-2 line-clamp-1">
                            "{pastMemory.title}"
                          </h4>

                          {pastSnippet && (
                            <p className="font-serif italic text-xs sm:text-sm text-[#59534B] line-clamp-2 mb-3.5 leading-relaxed bg-[#FFFFFF]/50 p-3 rounded-xl border border-[#D97706]/15">
                              "{pastSnippet}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] font-sans border-t border-[#D97706]/15 pt-3">
                            <span className="text-[#8C857B]">{pastMemory.messages?.length || 0} reflections recorded</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectInteraction) {
                                  onSelectInteraction(pastMemory);
                                }
                              }}
                              className="text-[#D97706] hover:text-[#B45309] font-medium flex items-center gap-1.5 transition-colors group cursor-pointer"
                            >
                              <span>Revisit Entry</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      )}

                      <EmptyStatePrompts
                        onSelectPrompt={(question) => {
                          setPromptInput(question);
                          setTimeout(() => {
                            textareaRef.current?.focus();
                          }, 50);
                        }}
                      />
                    </div>
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
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Docked Writing Desk Composer at Bottom */}
            {(!isEncrypted || isDecryptedUnlocked) && (
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
                  selectedPersona={selectedPersona}
                  onSelectPersona={setSelectedPersona}
                  thoughtGrammarEnabled={thoughtGrammarEnabled}
                  location={location}
                  onOpenLocationPicker={() => setIsLocationPickerOpen(true)}
                  attachedImage={attachedImage}
                  setAttachedImage={setAttachedImage}
                  audioMemo={audioMemo}
                  onSaveAudioMemo={(memo) => setAudioMemo(memo)}
                  isEncrypted={isEncrypted}
                  onToggleEncryption={handleToggleEncryption}
                />
              </div>
            )}
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
                    Idea Map
                  </h3>
                  <p className="text-xs text-[#595652] font-serif">
                    Visualize the flow of your thoughts, questions, and insights in an interactive graph.
                  </p>
                </div>
                <button
                  onClick={() => handleSubmitPrompt('thinking_map')}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-xs font-sans uppercase tracking-[0.2em] px-6 py-3 transition-all duration-200 rounded-sm font-semibold"
                >
                  <Compass className="w-4 h-4" />
                  <span>Generate Idea Map →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'woodcut' && (
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-4">
            <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-6 sm:p-8 rounded-xs space-y-6 max-w-xl mx-auto shadow-xs">
              <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#C4432B]/10 text-[#C4432B] flex items-center justify-center mx-auto">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-medium text-[#2B2A28]">
                  AI Entry Artwork
                </h3>
                <p className="text-xs text-[#595652] font-serif">
                  Turn this entry's core reflection into custom artwork using Google Imagen 3.
                </p>
              </div>

              {illuminatedArtUrl ? (
                <div className="space-y-4 text-center">
                  <div className="relative inline-block border-4 border-[#2B2A28] p-1 bg-[#F7F4EE] shadow-xl rounded-2xs">
                    <img
                      src={illuminatedArtUrl}
                      alt="Illuminated Manuscript Woodcut Artwork"
                      className="max-h-80 w-auto object-contain mx-auto rounded-3xs"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <a
                      href={illuminatedArtUrl}
                      download={`entry-artwork-${Date.now()}.jpg`}
                      className="px-4 py-2 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-[10px] font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Art</span>
                    </a>
                    <button
                      onClick={async () => {
                        if (!user || isGeneratingArt) return;
                        setIsGeneratingArt(true);
                        try {
                          const idToken = await user.getIdToken();
                          const res = await fetch('/api/generate-woodcut', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${idToken}`,
                            },
                            body: JSON.stringify({
                              title,
                              coreAxiom: cognitiveAnalysis?.coreAxiom || messages.find((m) => m.role === 'user')?.content.slice(0, 100),
                              category,
                            }),
                          });
                          const data = await res.json();
                          if (data.imageUrl) {
                            setIlluminatedArtUrl(data.imageUrl);
                            if (currentInteraction) {
                              commitToFirestore({
                                ...currentInteraction,
                                illuminatedArtUrl: data.imageUrl,
                                updatedAt: new Date().toISOString(),
                              });
                            }
                          }
                        } catch (err: any) {
                          console.error('Artwork generation failed:', err);
                        } finally {
                          setIsGeneratingArt(false);
                        }
                      }}
                      disabled={isGeneratingArt}
                      className="px-4 py-2 border border-[#E2DDD5] hover:border-[#C4432B] text-[#595652] hover:text-[#C4432B] text-[10px] font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1.5"
                    >
                      {isGeneratingArt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>New Artwork</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[#E2DDD5] p-8 text-center space-y-4 rounded-xs bg-[#FAF7F0]/40">
                  <p className="text-xs font-serif italic text-[#8A8478]">
                    No artwork has been created for this entry yet.
                  </p>
                  <button
                    onClick={async () => {
                      if (!user || isGeneratingArt) return;
                      setIsGeneratingArt(true);
                      try {
                        const idToken = await user.getIdToken();
                        const res = await fetch('/api/generate-woodcut', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                          },
                          body: JSON.stringify({
                            title,
                            coreAxiom: cognitiveAnalysis?.coreAxiom || messages.find((m) => m.role === 'user')?.content.slice(0, 100),
                            category,
                          }),
                        });
                        const data = await res.json();
                        if (data.imageUrl) {
                          setIlluminatedArtUrl(data.imageUrl);
                          if (currentInteraction) {
                            commitToFirestore({
                              ...currentInteraction,
                              illuminatedArtUrl: data.imageUrl,
                              updatedAt: new Date().toISOString(),
                            });
                          }
                        }
                      } catch (err: any) {
                        console.error('Artwork generation failed:', err);
                      } finally {
                        setIsGeneratingArt(false);
                      }
                    }}
                    disabled={isGeneratingArt || messages.length === 0}
                    className="px-6 py-2.5 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-[10px] font-sans uppercase tracking-[0.18em] font-semibold rounded-xs transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {isGeneratingArt ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Artwork...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Entry Artwork →</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Journal Location Picker Modal */}
      {isLocationPickerOpen && (
        <JournalLocationPicker
          isOpen={isLocationPickerOpen}
          onClose={() => setIsLocationPickerOpen(false)}
          currentLocation={location}
          onSaveLocation={(loc) => {
            setLocation(loc);
            setSaveStatus('unsaved');
            if (currentInteraction) {
              commitToFirestore({
                ...currentInteraction,
                location: loc || undefined,
                updatedAt: new Date().toISOString(),
              });
            }
          }}
        />
      )}

      {/* Zero-Knowledge End-to-End Encryption Passphrase Modal */}
      <PassphraseModal
        isOpen={showPassphraseModal}
        mode={passphraseModalMode}
        onConfirm={async (pass) => {
          setSessionPassphrase(pass);
          setIsEncrypted(true);
          setShowPassphraseModal(false);
          if (pendingUnsavedInteraction) {
            await commitToFirestore(pendingUnsavedInteraction);
          }
        }}
        onClose={() => {
          setShowPassphraseModal(false);
        }}
      />
    </div>
  );
};
