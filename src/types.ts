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
