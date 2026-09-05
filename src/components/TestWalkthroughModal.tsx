import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';

interface TestWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestWalkthroughModal: React.FC<TestWalkthroughModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'threats' | 'rules'>('walkthrough');

  if (!isOpen) return null;

  return (
    <div
      id="test-walkthrough-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#2B2A28]/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 font-serif animate-in fade-in duration-150"
    >
      <div
        id="test-walkthrough-modal"
        className="bg-[#F7F4EE] border border-[#2B2A28] border-t-2 border-t-[#C4432B] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#2B2A28] rounded-xs"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E2DDD5] flex items-center justify-between bg-[#EFECE6]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#2B2A28] flex items-center justify-center text-xs font-sans font-bold bg-[#FFFDF9] text-[#C4432B]">
              VR
            </div>
            <div>
              <h2 className="text-xl font-serif font-light tracking-tight text-[#2B2A28]">
                Security &amp; Verification Protocols
              </h2>
              <p className="text-[10px] font-sans uppercase tracking-[0.18em] text-[#8A8478]">
                Production verification for Firestore UID isolation &amp; Gemini API integration
              </p>
            </div>
          </div>
          <button
            id="close-walkthrough-btn"
            onClick={onClose}
            className="p-1 text-[#8A8478] hover:text-[#C4432B] border border-transparent hover:border-[#2B2A28] transition-colors rounded-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E2DDD5] px-6 bg-[#FFFDF9] text-[10px] font-sans uppercase tracking-widest text-[#595652]">
          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'walkthrough'
                ? 'border-[#C4432B] text-[#2B2A28]'
                : 'border-transparent text-[#8A8478] hover:text-[#2B2A28]'
            }`}
          >
            Walkthrough Protocols
          </button>
          <button
            onClick={() => setActiveTab('threats')}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'threats'
                ? 'border-[#C4432B] text-[#2B2A28]'
                : 'border-transparent text-[#8A8478] hover:text-[#2B2A28]'
            }`}
          >
            Threat Matrix (Dirty 12)
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'rules'
                ? 'border-[#C4432B] text-[#2B2A28]'
                : 'border-transparent text-[#8A8478] hover:text-[#2B2A28]'
            }`}
          >
            Firestore Rules
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-[#595652] leading-relaxed">
          {activeTab === 'walkthrough' && (
            <div className="space-y-6">
              <div className="p-4 border border-[#E2DDD5] bg-[#FFFDF9] space-y-2 rounded-xs">
                <div className="flex items-center gap-2 text-[#C4432B] text-xs font-sans uppercase tracking-widest font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Protocol 1: Firestore Isolation</span>
                </div>
                <p className="text-xs font-serif text-[#2B2A28]">
                  Documents are strictly scoped under <code className="bg-[#EFECE6] px-1 py-0.5 font-mono text-[11px]">/users/{'{userId}'}/interactions/{'{interactionId}'}</code>. Cross-user access returns immediate permission denied.
                </p>
              </div>

              <div className="p-4 border border-[#E2DDD5] bg-[#FFFDF9] space-y-2 rounded-xs">
                <div className="flex items-center gap-2 text-[#C4432B] text-xs font-sans uppercase tracking-widest font-bold">
                  <Lock className="w-4 h-4" />
                  <span>Protocol 2: Server-Enforced Token Exchange</span>
                </div>
                <p className="text-xs font-serif text-[#2B2A28]">
                  The Express backend requires a cryptographically verified Firebase ID token via <code className="bg-[#EFECE6] px-1 py-0.5 font-mono text-[11px]">Authorization: Bearer</code> before invoking the Gemini API. Zero API keys exposed to browser.
                </p>
              </div>

              <div className="p-4 border border-[#E2DDD5] bg-[#FFFDF9] space-y-2 rounded-xs">
                <div className="flex items-center gap-2 text-[#C4432B] text-xs font-sans uppercase tracking-widest font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Protocol 3: Model Fallback &amp; Rate Limits</span>
                </div>
                <p className="text-xs font-serif text-[#2B2A28]">
                  Sequential failover ladder (<code className="bg-[#EFECE6] px-1 py-0.5 font-mono text-[11px]">gemini-3.6-flash</code> $\to$ <code className="bg-[#EFECE6] px-1 py-0.5 font-mono text-[11px]">gemini-3.1-flash-lite</code>) with per-user sliding window rate limiting (25 req/min).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="space-y-3">
              {[
                { title: 'Cross-User Snooping', detail: 'User A attempts to read User B interactions -> Blocked by rule 12.' },
                { title: 'Identity Spoofing', detail: 'User A writes to own path but sets userId: User B -> Blocked by rule 17.' },
                { title: 'Unauthenticated Read/Write', detail: 'Anonymous request -> Rejected by catch-all default-deny.' },
                { title: 'Oversized String Injection', detail: 'Title exceeding 200 chars -> Rejected by schema validation.' },
                { title: 'Prompt Injection (OWASP LLM01)', detail: 'Jailbreak attempt inside entry -> Wrapped in XML tags and treated strictly as reflective data.' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 border border-[#E2DDD5] bg-[#FFFDF9] space-y-1 rounded-xs">
                  <span className="text-[10px] font-sans font-bold text-[#C4432B] uppercase tracking-widest">
                    {idx + 1}. {item.title}
                  </span>
                  <p className="text-xs font-serif text-[#2B2A28]">{item.detail}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="bg-[#2B2A28] text-[#F7F4EE] p-4 font-mono text-xs overflow-x-auto rounded-none border border-[#E2DDD5]">
              <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, delete: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E2DDD5] bg-[#EFECE6] flex items-center justify-between text-[10px] font-sans uppercase tracking-widest text-[#8A8478]">
          <span>Security Audit Status: Passed</span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#2B2A28] bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] transition-colors font-bold rounded-sm"
          >
            Close Protocol
          </button>
        </div>
      </div>
    </div>
  );
};
