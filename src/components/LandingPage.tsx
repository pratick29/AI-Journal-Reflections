import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Feather,
  Compass,
  Sparkles,
  MapPin,
  Palette,
  CloudRain,
  Lock,
  Bell,
  BookOpen,
  Heart,
  Check,
  Users,
  MessageSquare,
  Sun,
  Shield,
  Headphones,
  Calendar,
  Zap,
} from 'lucide-react';
import { AmbientCanvas } from './common/AmbientCanvas';

interface LandingPageProps {
  onOpenWalkthrough: () => void;
}

interface DemoPrompt {
  id: string;
  icon: string;
  label: string;
  userText: string;
  guideName: string;
  guideAvatar: string;
  response: string;
  emotion: string;
  takeaway: string;
}

const DEMO_PROMPTS: DemoPrompt[] = [
  {
    id: 'overwhelm',
    icon: '🌪️',
    label: 'Feeling Overwhelmed',
    userText: 'I feel restless and overwhelmed by conflicting priorities. Even when I finish tasks, I feel behind.',
    guideName: 'Marcus Aurelius',
    guideAvatar: '🏛️',
    response:
      'Ask yourself at every moment: "Is this essential?" Much of what we do and say is not necessary. If you eliminate it, you will have more leisure and more tranquility. You are not behind life; you are simply carrying burdens that do not belong to this hour.',
    emotion: 'Inner Friction · Restlessness',
    takeaway: 'Urgency has quietly replaced importance in your daily decisions.',
  },
  {
    id: 'gratitude',
    icon: '🌿',
    label: 'Quiet Gratitude',
    userText: 'Sat on the balcony this morning with hot coffee before anyone woke up. The morning mist was completely still.',
    guideName: 'Alan Watts',
    guideAvatar: '🌊',
    response:
      'That single cup in the stillness is the whole universe arriving at itself. You didn’t need to manufacture meaning; the silence was already complete. Carry that undisturbed center with you through the noisy day.',
    emotion: 'Equanimity · Peace',
    takeaway: 'Presence is not a goal to achieve, but an observation of the already whole.',
  },
  {
    id: 'decision',
    icon: '⚖️',
    label: 'Tough Crossroads',
    userText: 'I have an opportunity to take a bigger risk in my career, but staying where I am is comfortable and safe.',
    guideName: 'Simone de Beauvoir',
    guideAvatar: '✒️',
    response:
      'Comfort often masks bad faith—the belief that inaction is not a choice. Every choice creates who you become. Examine whether "safety" is preserving your freedom or subtly postponing your true engagement with the world.',
    emotion: 'Ambition · Uncertainty',
    takeaway: 'Staying still is an active choice, not a neutral default.',
  },
  {
    id: 'validation',
    icon: '🔍',
    label: 'Seeking Validation',
    userText: 'I notice I keep checking my phone to see how people reacted to my work. Why do I care so much?',
    guideName: 'Carl Jung',
    guideAvatar: '🕯️',
    response:
      'The persona—the social mask we present—hungers endlessly for applause because it possesses no internal substance of its own. What you are seeking externally is permission to approve of what you have already made.',
    emotion: 'Curiosity · Self-Doubt',
    takeaway: 'Your worth is not a consensus vote; ground yourself in your own standards.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenWalkthrough }) => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();
  const [heroTab, setHeroTab] = useState<'reflection' | 'insights' | 'maps' | 'artwork' | 'mentors'>('reflection');
  const [activeDemoPrompt, setActiveDemoPrompt] = useState<DemoPrompt>(DEMO_PROMPTS[0]);

  return (
    <div
      id="landing-container"
      className="min-h-screen bg-[#F7F4EE] text-[#2B2A28] flex flex-col justify-between font-serif selection:bg-[#2B2A28] selection:text-[#F7F4EE] paper-texture relative overflow-x-hidden"
    >
      {/* Living Atmospheric Embers Canvas Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-80">
        <AmbientCanvas enabled={true} />
      </div>

      {/* Top Editorial Navbar */}
      <header className="border-b border-[#E2DDD5] px-6 py-4 sm:px-12 flex justify-between items-center bg-[#F7F4EE]/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C4432B]/10 border border-[#C4432B]/30 flex items-center justify-center text-[#C4432B]">
            <Feather className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xl font-serif tracking-tight text-[#2B2A28] font-normal block leading-tight">
              AI Journal &amp; Reflections
            </span>
            <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#8A8478] hidden sm:block">
              Thoughtful Journaling &amp; AI Guides
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-5 font-sans">
          <button
            onClick={onOpenWalkthrough}
            className="text-[10px] uppercase tracking-[0.18em] text-[#8A8478] hover:text-[#C4432B] transition-colors hidden md:inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C4432B]" />
            <span>Tour &amp; Guide</span>
          </button>

          <button
            id="landing-signin-top-btn"
            onClick={signInWithGoogle}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-[10px] uppercase tracking-[0.18em] px-4 py-2 rounded-sm transition-all duration-200 shadow-sm active:scale-[0.99] font-medium"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Opening...' : 'Sign In with Google'}</span>
          </button>
        </div>
      </header>

      {/* Auth Error Banner */}
      {error && (
        <div className="bg-[#C4432B]/10 border-b border-[#C4432B]/30 px-6 py-3 text-xs text-[#C4432B] flex items-center justify-between font-sans relative z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="underline hover:text-[#2B2A28] uppercase text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 sm:py-16 flex-1 flex flex-col justify-center space-y-16">
        {/* Asymmetric Hero Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Headline, Philosophy & CTA */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EFECE6] border border-[#E2DDD5] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4432B] animate-ping" />
              <span className="text-[9px] font-sans uppercase tracking-[0.22em] text-[#C4432B] font-bold">
                Smart Personal Journal
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light tracking-tight leading-[1.08] text-[#2B2A28]">
                A quiet place <br />
                <span className="italic font-normal text-[#595652]">to understand yourself.</span>
                <span className="font-script text-[#C4432B] text-2xl sm:text-3xl block mt-1 font-normal select-none">
                  write what's on your mind and get thoughtful guidance...
                </span>
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[#595652] leading-relaxed max-w-xl font-serif">
              An easy-to-use personal journal that listens and helps you reflect. Tag places on <strong>Google Maps</strong>, talk with thoughtful historical guides like <strong>Marcus Aurelius</strong> and <strong>Carl Jung</strong>, understand your emotions, and turn your memories into vintage artwork.
            </p>

            {/* Primary Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 font-sans">
              <button
                id="landing-hero-cta"
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-xs uppercase tracking-[0.2em] px-8 py-3.5 rounded-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Opening...' : 'Start Free with Google →'}</span>
              </button>

              <a
                href="#interactive-demo"
                className="text-xs uppercase tracking-[0.16em] text-[#8A8478] hover:text-[#C4432B] transition-colors underline underline-offset-4 py-2"
              >
                Try Interactive Demo ↓
              </a>
            </div>

            {/* Feature Highlights Trust Badges */}
            <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-sans text-[#6E6A64]">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Private</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C4432B]" />
                <span>Gemini 2.5 AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Maps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-600" />
                <span>Imagen 3 Art</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live App Preview Card */}
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-[#E2DDD5]/40 transform translate-x-3 translate-y-3 -z-10 rounded-2xl blur-[2px]" />

            <div className="bg-[#FFFFFF] border border-[#E2DDD5]/90 shadow-[0_12px_40px_-8px_rgba(43,42,40,0.1)] rounded-2xl overflow-hidden flex flex-col">
              {/* Interactive Preview Tabs Bar */}
              <div className="bg-[#F7F4EE]/90 border-b border-[#E2DDD5]/70 px-4 pt-3 flex items-center justify-between gap-1.5 text-[10px] font-sans uppercase tracking-[0.14em] overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5 pb-2">
                  <button
                    onClick={() => setHeroTab('reflection')}
                    className={`px-3 py-1.5 rounded-full transition-all font-medium flex items-center gap-1.5 whitespace-nowrap ${
                      heroTab === 'reflection'
                        ? 'bg-[#1A1918] text-[#FFFFFF] shadow-xs'
                        : 'text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#FFFFFF]/60'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 text-[#C4432B]" />
                    <span>Reflection</span>
                  </button>

                  <button
                    onClick={() => setHeroTab('insights')}
                    className={`px-3 py-1.5 rounded-full transition-all font-medium flex items-center gap-1.5 whitespace-nowrap ${
                      heroTab === 'insights'
                        ? 'bg-[#1A1918] text-[#FFFFFF] shadow-xs'
                        : 'text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#FFFFFF]/60'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-[#C4432B]" />
                    <span>Insights</span>
                  </button>

                  <button
                    onClick={() => setHeroTab('maps')}
                    className={`px-3 py-1.5 rounded-full transition-all font-medium flex items-center gap-1.5 whitespace-nowrap ${
                      heroTab === 'maps'
                        ? 'bg-[#1A1918] text-[#FFFFFF] shadow-xs'
                        : 'text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#FFFFFF]/60'
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-[#C4432B]" />
                    <span>Places</span>
                  </button>

                  <button
                    onClick={() => setHeroTab('artwork')}
                    className={`px-3 py-1.5 rounded-full transition-all font-medium flex items-center gap-1.5 whitespace-nowrap ${
                      heroTab === 'artwork'
                        ? 'bg-[#1A1918] text-[#FFFFFF] shadow-xs'
                        : 'text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#FFFFFF]/60'
                    }`}
                  >
                    <Palette className="w-3 h-3 text-[#C4432B]" />
                    <span>Artwork</span>
                  </button>

                  <button
                    onClick={() => setHeroTab('mentors')}
                    className={`px-3 py-1.5 rounded-full transition-all font-medium flex items-center gap-1.5 whitespace-nowrap ${
                      heroTab === 'mentors'
                        ? 'bg-[#1A1918] text-[#FFFFFF] shadow-xs'
                        : 'text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#FFFFFF]/60'
                    }`}
                  >
                    <Feather className="w-3 h-3 text-[#C4432B]" />
                    <span>Mentors</span>
                  </button>
                </div>

                <span className="text-[9px] text-[#C4432B] font-bold px-2.5 py-0.5 bg-[#C4432B]/10 rounded-full shrink-0">
                  Live Preview
                </span>
              </div>

              {/* Preview Body based on Tab */}
              <div className="p-5 sm:p-6 space-y-4 min-h-[320px] flex flex-col justify-between">
                {heroTab === 'reflection' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-2 text-[10px] font-sans text-[#8A8478]">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#C4432B]" />
                        <span>Café de Flore, Paris · 17°C Partly Cloudy</span>
                      </span>
                      <span className="font-mono text-[9px]">Mood: Equanimity 🌿</span>
                    </div>

                    {/* Author Query */}
                    <div className="bg-[#FAF7F0] p-3.5 border-l-2 border-[#C4432B] rounded-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-sans text-[#8A8478]">
                        <span className="font-bold text-[#2B2A28] uppercase tracking-wider">You wrote</span>
                        <span>Today at 08:30</span>
                      </div>
                      <p className="text-xs sm:text-sm font-serif italic text-[#2B2A28] leading-relaxed">
                        "I keep feeling like I have to rush everything, as if someone is timing my progress. How do I slow down without feeling lazy?"
                      </p>
                    </div>

                    {/* Guide Reply */}
                    <div className="bg-[#FFFDF9] border border-[#E2DDD5] p-3.5 rounded-xs space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base p-1 bg-[#EFECE6] border border-[#E2DDD5] rounded-xs">🏛️</span>
                        <div>
                          <span className="font-medium text-xs text-[#2B2A28] block">Marcus Aurelius</span>
                          <span className="text-[9px] font-sans text-[#8A8478]">Stoic Guide</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-serif text-[#595652] leading-relaxed pl-1">
                        "Nature creates nothing in a panic. The tree does not rush its fruit. Ask yourself: does rushing add a single hour to your life, or merely strip the present moment of its virtue?"
                      </p>
                    </div>
                  </div>
                )}

                {heroTab === 'insights' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold">
                        AI DISTILLED CLARITY
                      </span>
                      <h4 className="text-lg font-serif font-light text-[#2B2A28] mt-0.5">
                        Key Insights &amp; Reframes
                      </h4>
                    </div>

                    <div className="bg-[#FAF7F0] p-3.5 border-l-2 border-[#C4432B] rounded-xs">
                      <span className="text-[9px] font-sans uppercase tracking-wider font-bold text-[#8A8478] block">
                        MAIN TAKEAWAY
                      </span>
                      <p className="text-xs sm:text-sm font-serif italic text-[#2B2A28] mt-1">
                        "You confuse hurried anxiety with productive ambition. Peace of mind produces higher quality action."
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-sans uppercase tracking-wider font-bold text-[#8A8478] block">
                        EMOTIONAL TONE
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Anxious Urgency', 'Hidden Ambition', 'Longing for Peace'].map((tag, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 bg-[#EFECE6] border border-[#E2DDD5] text-[10px] font-sans uppercase tracking-wider text-[#2B2A28] rounded-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 border-t border-[#E2DDD5]/60 pt-2 text-[11px] font-serif text-[#595652]">
                      <span className="font-sans text-[9px] uppercase tracking-wider font-bold text-[#C4432B]">
                        PERSPECTIVE REFRAME:
                      </span>
                      <p className="italic">
                        "What would tomorrow look like if your primary metric of success was calm thoroughness instead of speed?"
                      </p>
                    </div>
                  </div>
                )}

                {heroTab === 'maps' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold">
                          GOOGLE MAPS INTEGRATION
                        </span>
                        <h4 className="text-lg font-serif font-light text-[#2B2A28] mt-0.5">
                          Location-Aware Memories
                        </h4>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-sans">
                        📍 Coordinates Saved
                      </span>
                    </div>

                    <div className="bg-[#EFECE6]/60 border border-[#E2DDD5] p-4 rounded-xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#C4432B]/10 flex items-center justify-center text-[#C4432B]">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-serif font-medium text-sm text-[#2B2A28] block">
                              Kyoto Bamboo Grove, Japan
                            </span>
                            <span className="text-[10px] font-sans text-[#8A8478]">
                              35.0169° N, 135.6713° E
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-sans text-[#595652]">
                          <span className="font-semibold block">19°C · Clear Sky</span>
                          <span className="text-[#8A8478]">Sunrise</span>
                        </div>
                      </div>

                      <p className="text-xs font-serif italic text-[#595652] leading-relaxed border-t border-[#E2DDD5] pt-2">
                        "The sound of the wind through the tall green stalks sounded like distant ocean waves. Pinned this thought to remember how big the world is."
                      </p>
                    </div>

                    <div className="text-[10px] font-sans text-[#8A8478] flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pin locations anywhere worldwide with interactive place search &amp; atmospheric weather.</span>
                    </div>
                  </div>
                )}

                {heroTab === 'artwork' && (
                  <div className="space-y-3 text-center animate-in fade-in duration-200">
                    <div className="text-left">
                      <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold">
                        GOOGLE IMAGEN 3 ART
                      </span>
                      <h4 className="text-lg font-serif font-light text-[#2B2A28] mt-0.5">
                        Illuminated Entry Woodcuts
                      </h4>
                    </div>

                    {/* Stylized SVG Engraving Mockup */}
                    <div className="p-3 bg-[#FAF7F0] border border-[#E2DDD5] rounded-xs inline-block shadow-inner mx-auto max-w-[280px]">
                      <svg viewBox="0 0 300 200" className="w-full h-auto text-[#2B2A28]">
                        <rect width="300" height="200" fill="#F7F4EE" />
                        <rect x="10" y="10" width="280" height="180" fill="none" stroke="#C4432B" strokeWidth="2" />
                        <rect x="15" y="15" width="270" height="170" fill="none" stroke="#2B2A28" strokeWidth="0.8" strokeDasharray="3 2" />
                        <circle cx="150" cy="90" r="50" fill="none" stroke="#C4432B" strokeWidth="1.5" />
                        <polygon points="150,45 170,90 200,90 175,110 185,140 150,120 115,140 125,110 100,90 130,90" fill="none" stroke="#2B2A28" strokeWidth="1" />
                        <text x="150" y="160" fontFamily="Georgia, serif" fontSize="11" fill="#C4432B" textAnchor="middle" fontStyle="italic">
                          "Stillness Amidst Motion"
                        </text>
                        <text x="150" y="175" fontFamily="monospace" fontSize="7" fill="#8A8478" textAnchor="middle" letterSpacing="1.5">
                          GOOGLE IMAGEN 3 · SPECIMEN 01
                        </text>
                      </svg>
                    </div>

                    <p className="text-[11px] font-serif text-[#595652] italic">
                      Every reflection can generate unique classical woodcut art reflecting your core axiom.
                    </p>
                  </div>
                )}

                {heroTab === 'mentors' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div>
                      <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold">
                        SOCRATIC &amp; STOIC GUIDES
                      </span>
                      <h4 className="text-lg font-serif font-light text-[#2B2A28] mt-0.5">
                        Choose Your Dialogue Partner
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left">
                      {[
                        { name: 'The Scribe', avatar: '📜', era: 'Perennial', focus: 'Gentle, compassionate mirror' },
                        { name: 'Marcus Aurelius', avatar: '🏛️', era: '121–180 CE', focus: 'Stoic duty & equanimity' },
                        { name: 'Carl Jung', avatar: '🕯️', era: '1875–1961', focus: 'Shadow work & individuation' },
                        { name: 'Socrates', avatar: '🏺', era: '470–399 BCE', focus: 'Playful questioning of premises' },
                        { name: 'Simone de Beauvoir', avatar: '✒️', era: '1908–1986', focus: 'Authenticity & responsibility' },
                        { name: 'Alan Watts', avatar: '🌊', era: '1915–1973', focus: 'Zen levity & flow of life' },
                      ].map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2 border border-[#E2DDD5] bg-[#FDFBF7] rounded-xs space-y-0.5 hover:border-[#C4432B] transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{m.avatar}</span>
                            <span className="text-[11px] font-medium text-[#2B2A28] truncate">{m.name}</span>
                          </div>
                          <p className="text-[9px] font-sans text-[#8A8478] leading-tight line-clamp-1">{m.focus}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom CTA within Preview Card */}
                <div className="pt-3 border-t border-[#E2DDD5] flex items-center justify-between text-[10px] font-sans">
                  <span className="text-[#8A8478]">Experience this in your private journal</span>
                  <button
                    onClick={signInWithGoogle}
                    className="text-[#C4432B] font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
                  >
                    <span>Sign In to Try</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Interactive "Try an Instant Reflection" Playground */}
        <section id="interactive-demo" className="pt-10 border-t border-[#E2DDD5]">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C4432B] font-bold">
              INTERACTIVE DEMO
            </span>
            <h3 className="text-2xl sm:text-4xl font-serif font-light text-[#2B2A28]">
              Try a Reflection Prompt
            </h3>
            <p className="text-xs sm:text-sm text-[#595652] font-serif">
              Click a theme below to see how our AI guides help you process feelings, spot blindspots, and find peace:
            </p>
          </div>

          {/* 4 Clickable Demo Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto mb-6 font-sans">
            {DEMO_PROMPTS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveDemoPrompt(item)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2.5 shadow-2xs ${
                  activeDemoPrompt.id === item.id
                    ? 'bg-[#FFFFFF] border-[#C4432B] shadow-sm ring-2 ring-[#C4432B]/30'
                    : 'bg-[#FFFFFF]/70 border-[#E2DDD5] hover:bg-[#FFFFFF] hover:border-[#C4432B]/40 text-[#595652]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl p-1 bg-[#F7F4EE] rounded-lg">{item.icon}</span>
                  {activeDemoPrompt.id === item.id && (
                    <span className="w-2 h-2 rounded-full bg-[#C4432B]" />
                  )}
                </div>
                <span className="text-xs font-semibold text-[#2B2A28] line-clamp-1">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Active Demo Output Card */}
          <div className="max-w-4xl mx-auto bg-[#FFFFFF] border border-[#E2DDD5]/90 p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_-4px_rgba(43,42,40,0.06)] space-y-6">
            <div className="space-y-2 border-b border-[#E2DDD5]/60 pb-4">
              <span className="text-[10px] font-sans uppercase tracking-wider text-[#8A8478] font-bold block">
                YOUR THOUGHT:
              </span>
              <p className="text-base sm:text-lg font-serif italic text-[#2B2A28] leading-relaxed">
                "{activeDemoPrompt.userText}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left: Guide Response */}
              <div className="md:col-span-8 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl p-1.5 bg-[#F7F4EE] border border-[#E2DDD5]/60 rounded-xl">
                    {activeDemoPrompt.guideAvatar}
                  </span>
                  <div>
                    <span className="font-serif font-medium text-sm text-[#2B2A28] block">
                      {activeDemoPrompt.guideName}
                    </span>
                    <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">
                      Perspective Guide
                    </span>
                  </div>
                </div>

                <div className="bg-[#F7F4EE]/70 p-4 sm:p-5 border border-[#E2DDD5]/70 rounded-xl text-xs sm:text-sm font-serif text-[#3D3A36] leading-relaxed shadow-2xs">
                  "{activeDemoPrompt.response}"
                </div>
              </div>

              {/* Right: Key Insight Badge */}
              <div className="md:col-span-4 space-y-3 bg-[#F7F4EE]/60 p-4 sm:p-5 border border-[#E2DDD5]/70 rounded-xl shadow-2xs">
                <div>
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#C4432B] font-bold block">
                    EMOTIONAL TONE
                  </span>
                  <span className="text-xs font-serif font-medium text-[#2B2A28] block mt-1">
                    {activeDemoPrompt.emotion}
                  </span>
                </div>

                <div className="border-t border-[#E2DDD5]/60 pt-2.5">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] font-bold block">
                    MAIN TAKEAWAY
                  </span>
                  <p className="text-xs font-serif italic text-[#595652] mt-1 leading-relaxed">
                    "{activeDemoPrompt.takeaway}"
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center border-t border-[#E2DDD5]">
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.18em] font-semibold text-[#C4432B] hover:text-[#2B2A28] transition-colors"
              >
                <span>Write about this in your private journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION: 6 Distinctive Capabilities Grid */}
        <section className="pt-10 border-t border-[#E2DDD5]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C4432B] font-bold">
                CRAFTED FOR MINDFUL DEPTH
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-light text-[#2B2A28] mt-1">
                Everything You Need for Honest Reflection
              </h3>
            </div>
            <span className="font-script text-[#C4432B] text-xl">privacy by design</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#FFFFFF] border border-[#E2DDD5]/80 hover:border-[#C4432B]/50 p-6 space-y-3 transition-all duration-200 group rounded-2xl shadow-[0_4px_20px_-2px_rgba(43,42,40,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(196,67,43,0.08)] hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#C4432B]/10 border border-[#C4432B]/20 flex items-center justify-center text-[#C4432B]">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="text-base font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                Location &amp; Weather Pins
              </h4>
              <p className="text-xs text-[#595652] leading-relaxed font-serif">
                Pin entries to places on Google Maps with real-time temperature and weather conditions, capturing where your life unfolds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#FFFFFF] border border-[#E2DDD5]/80 hover:border-[#C4432B]/50 p-6 space-y-3 transition-all duration-200 group rounded-2xl shadow-[0_4px_20px_-2px_rgba(43,42,40,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(196,67,43,0.08)] hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#C4432B]/10 border border-[#C4432B]/20 flex items-center justify-center text-[#C4432B]">
                <Palette className="w-4 h-4" />
              </div>
              <h4 className="text-base font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                Imagen 3 Artwork
              </h4>
              <p className="text-xs text-[#595652] leading-relaxed font-serif">
                Turn your philosophical realizations into antique Renaissance engravings and illuminated seals powered by Google Imagen 3.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#FFFFFF] border border-[#E2DDD5]/80 hover:border-[#C4432B]/50 p-6 space-y-3 transition-all duration-200 group rounded-2xl shadow-[0_4px_20px_-2px_rgba(43,42,40,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(196,67,43,0.08)] hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#C4432B]/10 border border-[#C4432B]/20 flex items-center justify-center text-[#C4432B]">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="text-base font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                Visual Idea Maps
              </h4>
              <p className="text-xs text-[#595652] leading-relaxed font-serif">
                Generate interactive reasoning graphs (DAG) connecting your thoughts, premises, and reframes so you can trace your logic visually.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#FFFFFF] border border-[#E2DDD5]/80 hover:border-[#C4432B]/50 p-6 space-y-3 transition-all duration-200 group rounded-2xl shadow-[0_4px_20px_-2px_rgba(43,42,40,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(196,67,43,0.08)] hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#C4432B]/10 border border-[#C4432B]/20 flex items-center justify-center text-[#C4432B]">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-base font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                Private Vault PIN
              </h4>
              <p className="text-xs text-[#595652] leading-relaxed font-serif">
                Lock your journal with a personal PIN code. Entries are stored in private isolated Firestore instances, never indexed or shared.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#FFFFFF] border border-[#E2DDD5]/80 hover:border-[#C4432B]/50 p-6 space-y-3 transition-all duration-200 group rounded-2xl shadow-[0_4px_20px_-2px_rgba(43,42,40,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(196,67,43,0.08)] hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#C4432B]/10 border border-[#C4432B]/20 flex items-center justify-center text-[#C4432B]">
                <Bell className="w-4 h-4" />
              </div>
              <h4 className="text-base font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                Slack &amp; Discord Relays
              </h4>
              <p className="text-xs text-[#595652] leading-relaxed font-serif">
                Connect webhooks to dispatch milestone entries, daily gratitude, or breakthrough insights straight to your private chat channels.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#FFFFFF] border border-[#E2DDD5]/80 hover:border-[#C4432B]/50 p-6 space-y-3 transition-all duration-200 group rounded-2xl shadow-[0_4px_20px_-2px_rgba(43,42,40,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(196,67,43,0.08)] hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#C4432B]/10 border border-[#C4432B]/20 flex items-center justify-center text-[#C4432B]">
                <Headphones className="w-4 h-4" />
              </div>
              <h4 className="text-base font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                Ambient Soundscapes
              </h4>
              <p className="text-xs text-[#595652] leading-relaxed font-serif">
                Flow into deep writing with built-in sounds of gentle rain, crackling hearth fireplace, and quiet antique library acoustics.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Call to Action Card */}
        <section className="bg-[#FFFFFF] border border-[#E2DDD5]/90 p-8 sm:p-12 text-center rounded-2xl space-y-5 shadow-[0_8px_30px_-4px_rgba(43,42,40,0.06)]">
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C4432B] font-bold">
              START YOUR SANCTUARY
            </span>
            <h3 className="text-3xl sm:text-4xl font-serif font-light text-[#2B2A28]">
              Give your mind a quiet space to breathe.
            </h3>
            <p className="text-xs sm:text-sm text-[#595652] font-serif">
              Free, private, and ready whenever you need to reflect. Sign in securely with your Google account.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-xs font-sans uppercase tracking-[0.2em] px-8 py-4 rounded-sm transition-all duration-200 shadow-md hover:shadow-xl font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Opening...' : 'Begin Writing with Google'}</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2DDD5] px-6 py-5 sm:px-12 bg-[#EFECE6]/70 text-[10px] font-sans uppercase tracking-[0.18em] text-[#8A8478] flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <Feather className="w-3.5 h-3.5 text-[#C4432B]" />
          <span>Personal Gemini Journal · Private &amp; Isolated</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenWalkthrough}
            className="hover:text-[#C4432B] underline transition-colors"
          >
            Security &amp; Architecture Specs
          </button>
          <span>·</span>
          <span>Google Gemini &amp; Maps</span>
        </div>
      </footer>
    </div>
  );
};
