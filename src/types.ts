/**
 * Core type definitions for Personal Gemini Journal
 */

export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'cognitive_lens' | 'thinking_map';

export type ThinkingMapNodeType =
  | 'central_inquiry'      // Core question or dilemma
  | 'user_premise'        // Explicit premise voiced by the author
  | 'emerging_theme'       // Synthesized pattern across exchanges
  | 'potential_tension'    // Contradiction or competing priorities
  | 'possible_assumption'  // Unexamined premise or cognitive heuristic
  | 'constructive_reframe' // Alternative philosophical or pragmatic perspective
  | 'open_question';       // Socratic inquiry propelling future thought

export type ThinkingMapSource = 'user_statement' | 'gemini_synthesis';

export interface ThinkingMapNode {
  id: string;                          // e.g., "node_1"
  type: ThinkingMapNodeType;
  source: ThinkingMapSource;           // Author voice vs. AI reflection
  label: string;                       // Short headline (max 8 words)
  summary: string;                     // Concise explanation (max 500 chars)
  passageCitations: string[];          // Exact quotes from transcript (max 2, max 300 chars each)
  messageIndices: number[];            // Valid 0-indexed turn numbers
  significance?: string;               // Epistemic role (max 500 chars)
}

export type ThinkingMapEdgeRelation =
  | 'supports'                         // Evidentiary or complementary
  | 'conflicts_with'                   // Tension, friction, or trade-off
  | 'assumes'                          // Relies upon an unstated premise
  | 'reframes'                         // Offers an alternative perspective
  | 'leads_to';                        // Dialectical consequence or open question

export interface ThinkingMapEdge {
  id: string;                          // e.g., "edge_1_2"
  sourceNodeId: string;
  targetNodeId: string;
  relation: ThinkingMapEdgeRelation;
  description?: string;                // Brief note on relationship
}

export interface ThinkingMap {
  id: string;
  generatedAt: number;
  modelUsed: string;
  centralTheme: string;
  nodes: ThinkingMapNode[];            // Bounded: 6 to 12 nodes
  edges: ThinkingMapEdge[];            // Bounded: 5 to 16 edges
}

export interface CognitiveAnalysis {
  coreAxiom: string;
  coreAxioms?: string[];
  emotionalResonance: string[];
  cognitiveBlindspots: string[];
  socraticQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface Interaction {
  id: string;
  userId: string;
  title: string;
  category: 'reflection' | 'brainstorm' | 'mindfulness' | 'gratitude' | 'goals';
  summary?: string;
  tags?: string[];
  cognitiveAnalysis?: CognitiveAnalysis;
  thinkingMap?: ThinkingMap;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export type PhilosophicalPersona =
  | 'default'
  | 'marcus_aurelius'
  | 'carl_jung'
  | 'socrates'
  | 'simone_de_beauvoir'
  | 'alan_watts';

export interface PersonaDefinition {
  id: PhilosophicalPersona;
  name: string;
  title: string;
  era: string;
  avatar: string;
  mantra: string;
  description: string;
}

export interface TimeCapsule {
  id: string;
  userId: string;
  title: string;
  content: string;
  sealedAt: string;
  unlocksAt: string;
  isSealed: boolean;
  temporalSynthesis?: string;
}

export interface DailyRitual {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type: 'morning_primer' | 'evening_examen';
  // Morning fields
  coreIntention?: string;
  anticipatedFriction?: string;
  stoicMaxim?: string;
  // Evening fields
  alignedActions?: string;
  emotionalFriction?: string;
  quietGratitude?: string;
  createdAt: string;
}

export interface ThoughtDistortion {
  id: string;
  name: string;
  pattern: RegExp;
  category: 'all_or_nothing' | 'catastrophizing' | 'should_statement' | 'emotional_reasoning' | 'mind_reading';
  reframeQuestion: string;
}

export type AuthorWaxSeal = 'quill' | 'temple' | 'candle' | 'olive' | 'owl' | 'compass';
export type SocraticTone = 'default' | 'gentle' | 'classical' | 'poetic' | 'direct';

export interface PersonalLexiconItem {
  id: string;
  term: string;
  meaning: string;
}

export interface AuthorProfile {
  penName: string;
  creed: string;
  waxSeal: AuthorWaxSeal;
  socraticTone: SocraticTone;
  defaultInterlocutor: PhilosophicalPersona;
  defaultHeadspace: string;
  lexicon: PersonalLexiconItem[];
  typographyStyle: 'newsreader' | 'roman' | 'minimal';
}

export const WAX_SEALS: { id: AuthorWaxSeal; symbol: string; label: string; desc: string }[] = [
  { id: 'quill', symbol: '🪶', label: 'The Quill', desc: 'Devotion to the written word and honest inquiry.' },
  { id: 'temple', symbol: '🏛️', label: 'The Temple', desc: 'Stoic duty, structural virtue, and inner fortress.' },
  { id: 'candle', symbol: '🕯️', label: 'The Candle', desc: 'Shadow work, introspection, and quiet illumination.' },
  { id: 'olive', symbol: '🌿', label: 'Olive Branch', desc: 'Equanimity, peaceful reconciliation, and grace.' },
  { id: 'owl', symbol: '🦉', label: 'The Owl', desc: 'Philosophical wisdom, discernment, and contemplation.' },
  { id: 'compass', symbol: '🧭', label: 'The Compass', desc: 'Directional truth, existential agency, and navigation.' },
];

export const SOCRATIC_TONES: { id: SocraticTone; label: string; desc: string }[] = [
  { id: 'default', label: 'Balanced Journal Mirror', desc: 'Thoughtful, empathetic, and gently encouraging.' },
  { id: 'gentle', label: 'Gentle & Nurturing', desc: 'Tender emotional validation, patient holding, and warmth.' },
  { id: 'classical', label: 'Classical Dialectic', desc: 'Rigorous Socratic inquiry that dismantles unexamined premises.' },
  { id: 'poetic', label: 'Poetic & Evocative', desc: 'Rich in literary metaphor, resonance, and aesthetic depth.' },
  { id: 'direct', label: 'Direct & Pragmatic', desc: 'Crisp, sobering, and focused on decisive moral action.' },
];


