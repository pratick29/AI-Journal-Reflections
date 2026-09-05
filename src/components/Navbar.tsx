import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, LogOut, CheckCircle, ShieldCheck, PanelLeftClose, PanelLeft, Feather, BarChart2, Lock, Calendar, Archive, Headphones, Sparkles, BookOpen, Sun, Compass, PenTool } from 'lucide-react';

interface NavbarProps {
  onNewReflection: () => void;
  onOpenWalkthrough: () => void;
  onOpenAnalytics: () => void;
  onOpenCalendar: () => void;
  onOpenBackup: () => void;
  onOpenSoundscapes: () => void;
  onLockVault: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isAmbientMotion?: boolean;
  onToggleAmbientMotion?: () => void;
  onOpenCapsule?: () => void;
  onOpenRitual?: () => void;
  onOpenConstellation?: () => void;
  onOpenAnthology?: () => void;
  thoughtGrammarEnabled?: boolean;
  onToggleThoughtGrammar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewReflection,
  onOpenWalkthrough,
  onOpenAnalytics,
  onOpenCalendar,
  onOpenBackup,
  onOpenSoundscapes,
  onLockVault,
  isSidebarOpen,
  onToggleSidebar,
  isAmbientMotion = true,
  onToggleAmbientMotion,
  onOpenCapsule,
  onOpenRitual,
  onOpenConstellation,
  onOpenAnthology,
  thoughtGrammarEnabled = true,
  onToggleThoughtGrammar,
}) => {
  const { user, signOutUser } = useAuth();

  const userInitials = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [isToolsOpen, setIsToolsOpen] = React.useState(false);
  const toolsMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="app-navbar"
      className="bg-[#F7F4EE]/90 backdrop-blur-md border-b border-[#E2DDD5] px-4 py-3 sm:px-6 sticky top-0 z-30 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Sidebar Toggle + Wordmark */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            id="toggle-sidebar-btn"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Collapse archives sidebar' : 'Expand archives sidebar'}
            aria-expanded={isSidebarOpen}
            className="p-1.5 border border-[#E2DDD5] hover:border-[#C4432B] bg-[#FFFDF9] text-[#2B2A28] transition-all flex items-center gap-1.5 rounded-sm"
            title={`${isSidebarOpen ? 'Hide' : 'Show'} Archives (⌘\\)`}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-[#8A8478]" />
            ) : (
              <PanelLeft className="w-4 h-4 text-[#8A8478]" />
            )}
            <span className="hidden sm:inline text-[10px] font-sans uppercase tracking-[0.18em] text-[#595652]">
              Archives
            </span>
          </button>

          <div className="border-l border-[#E2DDD5] pl-3 sm:pl-4">
            <div className="flex items-center gap-2">
              <Feather className="w-4 h-4 text-[#C4432B]" />
              <h1 className="text-lg sm:text-xl font-serif font-normal tracking-tight leading-none text-[#2B2A28]">
                Personal Gemini Journal
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 border border-[#E2DDD5] text-[9px] font-sans uppercase tracking-[0.18em] bg-[#EFECE6] text-[#595652]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4432B]"></span>
                <span>Firestore Isolated</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions & Session Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Inquiry Button (Primary CTA) */}
          <button
            id="new-reflection-nav-btn"
            onClick={onNewReflection}
            className="inline-flex items-center gap-1.5 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-[10px] font-sans uppercase tracking-[0.18em] px-3.5 py-1.5 sm:px-4 sm:py-2 transition-all duration-200 active:scale-[0.99] rounded-sm font-medium"
            title="Start New Inquiry (⌘N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Inquiry</span>
          </button>

          {/* Unified Studio Tools Dropdown Menu */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setIsToolsOpen((prev) => !prev)}
              aria-expanded={isToolsOpen}
              className="inline-flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-[0.15em] border border-[#E2DDD5] hover:border-[#C4432B] px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#FFFDF9] hover:bg-[#EFECE6] transition-colors text-[#595652] hover:text-[#2B2A28] rounded-sm"
              title="Studio Tools & Settings"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#C4432B]" />
              <span className="hidden sm:inline">Studio Tools</span>
              <span className="text-[8px] opacity-60">▾</span>
            </button>

            {isToolsOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] shadow-xl p-1.5 rounded-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 border-b border-[#E2DDD5]/60 mb-1">
                  <span className="text-[9px] font-sans uppercase tracking-[0.2em] font-bold text-[#8A8478]">
                    Studio Instruments
                  </span>
                </div>

                {/* Reflective & Mindful Tools */}
                {onOpenConstellation && (
                  <button
                    onClick={() => {
                      onOpenConstellation();
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-[#C4432B]" />
                      <span>Idea Constellation</span>
                    </div>
                    <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">Galaxy</span>
                  </button>
                )}

                {onOpenRitual && (
                  <button
                    onClick={() => {
                      onOpenRitual();
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      <span>Daily Dual Rituals</span>
                    </div>
                    <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">Primer</span>
                  </button>
                )}

                {onOpenCapsule && (
                  <button
                    onClick={() => {
                      onOpenCapsule();
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🕯️</span>
                      <span>Time Capsules &amp; Letters</span>
                    </div>
                    <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">Future</span>
                  </button>
                )}

                {onOpenAnthology && (
                  <button
                    onClick={() => {
                      onOpenAnthology();
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#C4432B]" />
                      <span>Book Anthology Specimen</span>
                    </div>
                    <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">Memoir</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenSoundscapes();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                >
                  <div className="flex items-center gap-2">
                    <Headphones className="w-3.5 h-3.5 text-[#C4432B]" />
                    <span>Ambient Acoustics</span>
                  </div>
                  <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">Audio</span>
                </button>

                <button
                  onClick={() => {
                    onOpenCalendar();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#C4432B]" />
                    <span>Writing Calendar &amp; Streaks</span>
                  </div>
                  <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">Archive</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAnalytics();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 text-[#C4432B]" />
                    <span>Cognitive Shift Analytics</span>
                  </div>
                  <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">Metrics</span>
                </button>

                <button
                  onClick={() => {
                    onLockVault();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#2B2A28]" />
                    <span>Lock Journal Vault</span>
                  </div>
                  <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">PIN</span>
                </button>

                <button
                  onClick={() => {
                    onOpenBackup();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                >
                  <div className="flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5 text-[#595652]" />
                    <span>Backup &amp; Restore Vault</span>
                  </div>
                  <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">JSON</span>
                </button>

                {onToggleThoughtGrammar && (
                  <button
                    onClick={() => {
                      onToggleThoughtGrammar();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs border-t border-[#E2DDD5]/60 mt-1 pt-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <PenTool className="w-3.5 h-3.5 text-[#C4432B]" />
                      <span>Thought Grammar Spotter</span>
                    </div>
                    <span className="text-[9px] font-sans uppercase tracking-wider font-bold text-[#C4432B]">
                      {thoughtGrammarEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                {onToggleAmbientMotion && (
                  <button
                    onClick={() => {
                      onToggleAmbientMotion();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#2B2A28] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#C4432B]" />
                      <span>Atmosphere Canvas</span>
                    </div>
                    <span className="text-[9px] font-sans uppercase tracking-wider font-bold text-[#C4432B]">
                      {isAmbientMotion ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenWalkthrough();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-serif text-[#595652] hover:bg-[#F7F4EE] transition-colors flex items-center justify-between rounded-xs border-t border-[#E2DDD5]/60 pt-1.5"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8A8478]" />
                    <span>Verification Protocols</span>
                  </div>
                  <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8478]">Info</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Info */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-[#E2DDD5]">
              <div className="text-right hidden md:block font-sans">
                <div className="flex items-center justify-end gap-1">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-[#2B2A28]">
                    Active Session
                  </p>
                  {user.emailVerified && (
                    <span title="Email Verified">
                      <CheckCircle className="w-2.5 h-2.5 text-[#C4432B]" />
                    </span>
                  )}
                </div>
                <p className="text-xs italic text-[#595652] truncate max-w-[130px] xl:max-w-[160px]">
                  {user.displayName || user.email}
                </p>
              </div>

              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-[#E2DDD5] object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border border-[#2B2A28] flex items-center justify-center text-[10px] font-sans bg-[#EFECE6] font-bold text-[#2B2A28]">
                  {userInitials}
                </div>
              )}

              <button
                id="signout-btn"
                onClick={signOutUser}
                className="p-1.5 text-[#8A8478] hover:text-[#C4432B] border border-transparent hover:border-[#E2DDD5] transition-colors rounded-sm"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
