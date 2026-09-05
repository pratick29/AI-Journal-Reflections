import { ThoughtDistortion } from '../../types';

export interface DistortionMatch {
  id: string;
  matchedText: string;
  distortionName: string;
  category: string;
  reframeQuestion: string;
  startIndex: number;
  endIndex: number;
}

export const DISTORTION_RULES: ThoughtDistortion[] = [
  {
    id: 'all_or_nothing',
    name: 'All-or-Nothing Framing',
    category: 'all_or_nothing',
    pattern: /\b(always|never|every\s*time|everyone|nobody|impossible|completely\s*ruined|totally\s*useless|nothing\s*ever\s*works)\b/gi,
    reframeQuestion: 'Is this truly absolute, or are there nuances and exceptions you might be overlooking?',
  },
  {
    id: 'catastrophizing',
    name: 'Catastrophizing',
    category: 'catastrophizing',
    pattern: /\b(what\s*if\s*everything\s*goes\s*wrong|disaster|ruined\s*my\s*life|end\s*of\s*the\s*world|can'?t\s*handle\s*this|doomed|worst\s*case)\b/gi,
    reframeQuestion: 'What is the most likely, grounded outcome rather than the most catastrophic one?',
  },
  {
    id: 'should_statement',
    name: 'Tyranny of the "Should"',
    category: 'should_statement',
    pattern: /\b(i\s*should\s*have|i\s*must\s*be|i\s*ought\s*to\s*be|they\s*should\s*have|why\s*can'?t\s*i\s*just)\b/gi,
    reframeQuestion: 'Does this "should" stem from an external expectation or your authentic, compassionate values?',
  },
  {
    id: 'emotional_reasoning',
    name: 'Emotional Reasoning',
    category: 'emotional_reasoning',
    pattern: /\b(i\s*feel\s*like\s*a\s*failure|because\s*i\s*feel\s*anxious\s*it\s*means|i\s*just\s*feel\s*hopeless|i\s*feel\s*guilty\s*so\s*i\s*must\s*be)\b/gi,
    reframeQuestion: 'Can you honor this feeling as an emotional weather pattern without treating it as objective truth?',
  },
  {
    id: 'mind_reading',
    name: 'Mind-Reading Assumption',
    category: 'mind_reading',
    pattern: /\b(they\s*all\s*think\s*i|everyone\s*is\s*judging|i\s*know\s*they\s*secretly|they\s*probably\s*hate)\b/gi,
    reframeQuestion: 'What concrete evidence do you have for this assumption versus pure subjective projection?',
  },
];

export function scanForThoughtDistortions(text: string): DistortionMatch[] {
  if (!text || text.length < 5) return [];

  const matches: DistortionMatch[] = [];
  const seenIndices = new Set<number>();

  for (const rule of DISTORTION_RULES) {
    const regex = new RegExp(rule.pattern.source, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;

      // Avoid overlapping duplicates
      if (!seenIndices.has(startIndex)) {
        seenIndices.add(startIndex);
        matches.push({
          id: `${rule.id}_${startIndex}`,
          matchedText: match[0],
          distortionName: rule.name,
          category: rule.category,
          reframeQuestion: rule.reframeQuestion,
          startIndex,
          endIndex,
        });
      }
    }
  }

  return matches.slice(0, 5); // Limit to top 5 to prevent visual noise
}
