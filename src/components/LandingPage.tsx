import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, AlertCircle, Feather, Compass, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onOpenWalkthrough: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenWalkthrough }) => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();

  return (
    <div id="landing-container" className="min-h-screen bg-[#F7F4EE] text-[#2B2A28] flex flex-col justify-between font-serif selection:bg-[#2B2A28] selection:text-[#F7F4EE] paper-texture">
      {/* Tighter, Clean Editorial Top Nav Bar */}
      <header className="border-b border-[#E2DDD5] px-6 py-4 sm:px-12 flex justify-between items-center bg-[#F7F4EE]/90 sticky top-0 z-30 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <Feather className="w-4.5 h-4.5 text-[#C4432B]" />
          <div>
            <span className="text-xl font-serif tracking-tight text-[#2B2A28] font-normal">
              Personal Gemini Journal
            </span>
          </div>
        </div>

        {/* Minimal Nav Links & Auth Button */}
        <div className="flex items-center gap-4 sm:gap-6 font-sans">
          <button
            onClick={onOpenWalkthrough}
            className="text-[10px] uppercase tracking-[0.2em] text-[#8A8478] hover:text-[#C4432B] transition-colors hidden sm:inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C4432B]" />
            <span>Verification &amp; Protocols</span>
          </button>
          <button
            id="landing-signin-top-btn"
            onClick={signInWithGoogle}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-sm transition-all duration-200 shadow-2xs active:scale-[0.99]"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Auth Error Banner */}
      {error && (
        <div className="bg-[#C4432B]/10 border-b border-[#C4432B]/30 px-6 py-3 text-xs text-[#C4432B] flex items-center justify-between font-sans">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="underline hover:text-[#2B2A28] uppercase text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Hero & Manuscript Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 sm:py-20 flex-1 flex flex-col justify-center">
        {/* Asymmetric Hero Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Confident Oversized Display Serif & Handwritten Marginalia */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2">
              <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C4432B] font-bold">
                VOLUME I · ISOLATED MANUSCRIPT
              </span>
              <span className="h-px w-8 bg-[#C4432B]/40" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-light tracking-tight leading-[1.04] text-[#2B2A28]">
                A quieter place <br />
                <span className="italic font-normal text-[#595652]">to think clearly.</span>
                <span className="font-script text-[#C4432B] text-2xl sm:text-3xl rotate-[-3deg] inline-block font-normal ml-3 select-none">
                  for honest thoughts...
                </span>
              </h1>
            </div>

            <p className="text-base sm:text-lg text-[#595652] leading-relaxed max-w-xl font-serif">
              An unhurried personal notebook for reflective writing, Socratic dialogue, and topological reasoning maps — protected by isolated Firestore storage and server-enforced Gemini intelligence.
            </p>

            {/* Primary Dark CTA (shifts to rust accent on hover) + Secondary Text Link */}
            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-5 font-sans">
              <button
                id="landing-hero-cta"
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-xs uppercase tracking-[0.22em] px-8 py-4 rounded-sm transition-all duration-200 shadow-sm active:scale-[0.99] font-medium"
              >
                <span>{loading ? 'Initializing Session...' : 'Begin Writing →'}</span>
              </button>

              <button
                onClick={onOpenWalkthrough}
                className="text-xs uppercase tracking-[0.18em] text-[#8A8478] hover:text-[#C4432B] transition-colors underline underline-offset-4"
              >
                Explore Protocols →
              </button>
            </div>
          </div>

          {/* Right Column: Manuscript Excerpt Card with Rust Corner Details */}
          <div className="lg:col-span-5 relative">
            {/* Subtle decorative background shadow shift */}
            <div className="absolute inset-0 bg-[#E2DDD5]/60 transform translate-x-2 translate-y-2 -z-10 rounded-xs" />

            <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-6 sm:p-8 shadow-sm space-y-6 relative">
              <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3 text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4432B]" />
                  <span>Manuscript Excerpt</span>
                </span>
                <span className="text-[#C4432B] font-bold">Ref. 07</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-sans uppercase tracking-[0.18em] text-[#8A8478]">
                    AUTHOR REFLECTION
                  </p>
                  <span className="font-script text-[#C4432B] text-sm">written at 14:32</span>
                </div>
                <p className="text-sm font-serif italic text-[#2B2A28] leading-relaxed pl-4 border-l-2 border-[#C4432B]">
                  "I keep postponing the strategic shift because I am balancing short-term momentum with long-term ambition..."
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-sans uppercase tracking-[0.18em] text-[#C4432B] flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#C4432B]" />
                  <span>GEMINI SYNTHESIS</span>
                </p>
                <div className="bg-[#EFECE6]/70 p-4 border border-[#E2DDD5] text-xs text-[#595652] leading-relaxed space-y-1.5">
                  <p className="font-semibold text-[#2B2A28]">Core Axiom:</p>
                  <p className="italic font-serif">"Urgency has quietly replaced importance in your decision criteria."</p>
                </div>
              </div>

              {/* Mini Topological Indicator */}
              <div className="pt-2 border-t border-[#E2DDD5] flex items-center justify-between text-[10px] font-sans uppercase tracking-widest text-[#8A8478]">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#C4432B]" />
                  <span>DAG Topology: 8 Nodes</span>
                </span>
                <span className="text-[#C4432B]">Verified Cycle-Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Three Editorial Perspectives Section */}
        <section className="mt-20 pt-14 border-t border-[#E2DDD5]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C4432B] font-bold">
                PERSPECTIVE SYSTEM
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-light text-[#2B2A28] mt-1">
                Three Modes for Deep Clarity
              </h3>
            </div>
            <span className="font-script text-[#C4432B] text-xl">structured contemplation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Perspective 01 */}
            <div className="bg-[#FFFDF9] border border-[#E2DDD5] hover:border-[#C4432B] p-7 space-y-4 transition-all duration-200 group">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold block">
                PERSPECTIVE 01
              </span>
              <h4 className="text-xl font-serif font-normal text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                Dialogue &amp; Reflection
              </h4>
              <p className="text-xs text-[#595652] leading-relaxed font-serif">
                Multi-turn conversational reflection with server-side dialogue depth management, prompt injection shielding, and resilient model fallback.
              </p>
            </div>

            {/* Perspective 02 */}
            <div className="bg-[#FFFDF9] border border-[#E2DDD5] hover:border-[#C4432B] p-7 space-y-4 transition-all duration-200 group">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold block">
                PERSPECTIVE 02
              </span>
              <h4 className="text-xl font-serif font-normal text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                Cognitive Lens Dossier
              </h4>
              <p className="text-xs text-[#595652] leading-relaxed font-serif">
                Structured mental model extraction isolating emotional nuances, cognitive blindspots, core axioms, and Socratic inquiries.
              </p>
            </div>

            {/* Perspective 03 */}
            <div className="bg-[#FFFDF9] border border-[#E2DDD5] hover:border-[#C4432B] p-7 space-y-4 transition-all duration-200 group">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold block">
                PERSPECTIVE 03
              </span>
              <h4 className="text-xl font-serif font-normal text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                Thinking Map Canvas
              </h4>
              <p className="text-xs text-[#595652] leading-relaxed font-serif">
                Topological reasoning visualization mapping explicit premises to AI reframes via verified directed acyclic graphs (DAG) with citation quotes.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2DDD5] px-6 py-5 sm:px-12 bg-[#EFECE6]/50 text-[10px] font-sans uppercase tracking-[0.18em] text-[#8A8478] flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>Personal Gemini Journal · Privately Authenticated</span>
        <button
          onClick={onOpenWalkthrough}
          className="hover:text-[#C4432B] underline transition-colors"
        >
          Security Specification &amp; Protocols
        </button>
      </footer>
    </div>
  );
};
