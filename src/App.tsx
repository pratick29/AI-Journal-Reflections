import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { HistoryList } from './components/HistoryList';
import { JournalEditor } from './components/JournalEditor';
import { VaultLockModal } from './components/VaultLockModal';
import { ZenMode } from './components/editor/ZenMode';
import { AmbientCanvas } from './components/common/AmbientCanvas';
import { SoundscapePlayer } from './components/common/SoundscapePlayer';
import { Interaction, PhilosophicalPersona, AuthorProfile } from './types';
import { subscribeUserInteractions } from './firebase/interactions';
import { Loader2 } from 'lucide-react';

// Dynamic Code-Splitting: Lazy-load heavy modals for instantaneous initial load speeds
const TestWalkthroughModal = React.lazy(() =>
  import('./components/TestWalkthroughModal').then((m) => ({ default: m.TestWalkthroughModal }))
);
const AnalyticsModal = React.lazy(() =>
  import('./components/AnalyticsModal').then((m) => ({ default: m.AnalyticsModal }))
);
const JournalCalendarModal = React.lazy(() =>
  import('./components/JournalCalendarModal').then((m) => ({ default: m.JournalCalendarModal }))
);
const VaultBackupModal = React.lazy(() =>
  import('./components/VaultBackupModal').then((m) => ({ default: m.VaultBackupModal }))
);
const QuoteCardModal = React.lazy(() =>
  import('./components/QuoteCardModal').then((m) => ({ default: m.QuoteCardModal }))
);
const TimeCapsuleModal = React.lazy(() =>
  import('./components/capsule/TimeCapsuleModal').then((m) => ({ default: m.TimeCapsuleModal }))
);
const DailyRitualModal = React.lazy(() =>
  import('./components/rituals/DailyRitualModal').then((m) => ({ default: m.DailyRitualModal }))
);
const ConstellationModal = React.lazy(() =>
  import('./components/constellation/ConstellationModal').then((m) => ({ default: m.ConstellationModal }))
);
const AnthologyModal = React.lazy(() =>
  import('./components/anthology/AnthologyModal').then((m) => ({ default: m.AnthologyModal }))
);
const CommandPaletteModal = React.lazy(() =>
  import('./components/palette/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal }))
);
const AuthorSanctuaryModal = React.lazy(() =>
  import('./components/profile/AuthorSanctuaryModal').then((m) => ({ default: m.AuthorSanctuaryModal }))
);
const SacredGroundsModal = React.lazy(() =>
  import('./components/maps/SacredGroundsModal').then((m) => ({ default: m.SacredGroundsModal }))
);
const AdminDashboardModal = React.lazy(() =>
  import('./components/admin/AdminDashboardModal').then((m) => ({ default: m.AdminDashboardModal }))
);
const NotificationSettingsModal = React.lazy(() =>
  import('./components/notifications/NotificationSettingsModal').then((m) => ({ default: m.NotificationSettingsModal }))
);

function MainApp() {
  const { user, loading } = useAuth();
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);
  const [isSoundscapesOpen, setIsSoundscapesOpen] = useState<boolean>(false);
  const [isAmbientMotion, setIsAmbientMotion] = useState<boolean>(true);
  const [isZenModeOpen, setIsZenModeOpen] = useState<boolean>(false);
  const [pinnedQuote, setPinnedQuote] = useState<string | null>(null);
  const [zenPromptInput, setZenPromptInput] = useState<string>('');

  // 7-Feature State
  const [isCapsuleOpen, setIsCapsuleOpen] = useState<boolean>(false);
  const [isRitualOpen, setIsRitualOpen] = useState<boolean>(false);
  const [isConstellationOpen, setIsConstellationOpen] = useState<boolean>(false);
  const [isAnthologyOpen, setIsAnthologyOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [thoughtGrammarEnabled, setThoughtGrammarEnabled] = useState<boolean>(true);
  const [isSacredGroundsOpen, setIsSacredGroundsOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Author Sanctuary Profile State
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'identity' | 'ledger' | 'preferences' | 'grounding'>('identity');
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('journal_author_profile');
        if (stored) return JSON.parse(stored);
      } catch (err) {
        console.warn('Failed to parse author profile:', err);
      }
    }
    return {
      penName: '',
      creed: 'To examine that which goes unsaid, and live with reasoned deliberate intent.',
      waxSeal: 'quill',
      socraticTone: 'default',
      defaultInterlocutor: 'default',
      defaultHeadspace: 'Reflective & Grounded',
      lexicon: [],
      typographyStyle: 'newsreader',
    };
  });

  const handleSaveProfile = (newProfile: AuthorProfile) => {
    setAuthorProfile(newProfile);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('journal_author_profile', JSON.stringify(newProfile));
      } catch (err) {
        console.warn('Failed to persist author profile:', err);
      }
    }
  };

  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(false);
  const [savedPin, setSavedPin] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('journal_vault_pin');
    }
    return null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Subscribe to interactions for analytics & calendar calculation
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserInteractions(
      user.uid,
      (data) => {
        setAllInteractions(data);
      },
      (err) => {
        console.warn('Interactions subscription notice:', err);
      }
    );
    return () => unsub();
  }, [user]);

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+\ or Ctrl+\: Toggle Archives sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      // Cmd+N or Ctrl+Alt+N: New Inquiry
      if ((e.metaKey || (e.ctrlKey && e.altKey)) && (e.key === 'n' || e.key === 'N')) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setSelectedInteraction(null);
        }
      }
      // Cmd+K or Ctrl+K: Universal Command Palette
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Escape: close mobile sidebar if open
      if (e.key === 'Escape' && isSidebarOpen && window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const handleSetPin = (newPin: string) => {
    setSavedPin(newPin);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('journal_vault_pin', newPin);
    }
  };

  if (loading) {
    return (
      <div id="app-loading" className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center space-y-3 font-serif">
        <Loader2 className="w-6 h-6 animate-spin text-[#A94A38]" />
        <p className="text-xs font-sans uppercase tracking-[0.2em] text-[#8C857B]">Opening Manuscript...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage onOpenWalkthrough={() => setIsWalkthroughOpen(true)} />
        <TestWalkthroughModal
          isOpen={isWalkthroughOpen}
          onClose={() => setIsWalkthroughOpen(false)}
        />
      </>
    );
  }

  return (
    <div id="dashboard-container" className="h-screen w-full flex flex-col bg-[#FBF9F5] text-[#1A1918] font-serif overflow-hidden paper-texture relative">
      {/* Living Atmospheric Background Motion Canvas */}
      <AmbientCanvas enabled={isAmbientMotion} />

      <Navbar
        onNewReflection={() => setSelectedInteraction(null)}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenSoundscapes={() => setIsSoundscapesOpen(true)}
        onLockVault={() => setIsVaultLocked(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isAmbientMotion={isAmbientMotion}
        onToggleAmbientMotion={() => setIsAmbientMotion((prev) => !prev)}
        onOpenCapsule={() => setIsCapsuleOpen(true)}
        onOpenRitual={() => setIsRitualOpen(true)}
        onOpenConstellation={() => setIsConstellationOpen(true)}
        onOpenAnthology={() => setIsAnthologyOpen(true)}
        thoughtGrammarEnabled={thoughtGrammarEnabled}
        onToggleThoughtGrammar={() => setThoughtGrammarEnabled((prev) => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        authorProfile={authorProfile}
        onOpenProfile={(tab = 'identity') => {
          setProfileInitialTab(tab);
          setIsProfileOpen(true);
        }}
        onOpenSacredGrounds={() => setIsSacredGroundsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar (Collapsible in flow) */}
        <div
          className={`hidden lg:block h-full transition-all duration-200 shrink-0 ${
            isSidebarOpen ? 'w-80 xl:w-96' : 'w-0 overflow-hidden'
          }`}
        >
          {isSidebarOpen && (
            <HistoryList
              selectedId={selectedInteraction?.id || null}
              onSelectInteraction={(item) => setSelectedInteraction(item)}
              onNewSession={() => setSelectedInteraction(null)}
            />
          )}
        </div>

        {/* Mobile / Tablet Drawer (Slide-over with Backdrop) */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            {/* Backdrop blur overlay */}
            <div
              className="fixed inset-0 bg-[#1A1918]/30 backdrop-blur-xs transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer Container */}
            <div className="relative w-5/6 max-w-sm h-full z-50 animate-in slide-in-from-left duration-200">
              <HistoryList
                selectedId={selectedInteraction?.id || null}
                onSelectInteraction={(item) => {
                  setSelectedInteraction(item);
                  setIsSidebarOpen(false);
                }}
                onNewSession={() => {
                  setSelectedInteraction(null);
                  setIsSidebarOpen(false);
                }}
                onClose={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Journal & Multi-Turn Gemini Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FBF9F5]">
          <JournalEditor
            currentInteraction={selectedInteraction}
            onInteractionSaved={(saved) => setSelectedInteraction(saved)}
            onNewSession={() => setSelectedInteraction(null)}
            onOpenZenMode={() => setIsZenModeOpen(true)}
            onPinQuote={(quoteText) => setPinnedQuote(quoteText)}
            thoughtGrammarEnabled={thoughtGrammarEnabled}
            authorProfile={authorProfile}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            allInteractions={allInteractions}
            onSelectInteraction={(item) => setSelectedInteraction(item)}
          />
        </div>
      </main>

      {/* Editorial System Status Footer */}
      <footer className="h-8 sm:h-9 border-t border-[#E5E0D8] flex items-center px-4 sm:px-6 justify-between text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.18em] text-[#8C857B] bg-[#F4F0E8]/60 shrink-0">
        <span className="truncate max-w-[200px] sm:max-w-none">Firestore Isolated · us-central1</span>
        <span className="hidden sm:inline">Engine: Gemini 3.6 Flash</span>
        <span className="truncate">Encryption: AES-256</span>
      </footer>

      {/* Zen Distraction-Free Writing Studio */}
      <ZenMode
        isOpen={isZenModeOpen}
        onClose={() => setIsZenModeOpen(false)}
        promptInput={zenPromptInput}
        setPromptInput={setZenPromptInput}
        onSubmitInquiry={() => {
          const manuscriptInput = document.getElementById('manuscript-input') as HTMLTextAreaElement;
          if (manuscriptInput) {
            manuscriptInput.value = zenPromptInput;
            const event = new Event('input', { bubbles: true });
            manuscriptInput.dispatchEvent(event);
          }
          const submitBtn = document.getElementById('submit-inquiry-btn') as HTMLButtonElement;
          if (submitBtn) submitBtn.click();
        }}
        isGenerating={false}
      />

      {/* Literary Ambient Soundscapes Studio */}
      <SoundscapePlayer
        isOpen={isSoundscapesOpen}
        onClose={() => setIsSoundscapesOpen(false)}
      />

      {/* Journal Vault Lock Modal */}
      <VaultLockModal
        isLocked={isVaultLocked}
        onUnlock={() => setIsVaultLocked(false)}
        onSetPin={handleSetPin}
        savedPin={savedPin}
      />

      {/* Lazy-Loaded Modals wrapped in Suspense */}
      <React.Suspense fallback={null}>
        {isWalkthroughOpen && (
          <TestWalkthroughModal
            isOpen={isWalkthroughOpen}
            onClose={() => setIsWalkthroughOpen(false)}
          />
        )}

        {isAnalyticsOpen && (
          <AnalyticsModal
            isOpen={isAnalyticsOpen}
            onClose={() => setIsAnalyticsOpen(false)}
            interactions={allInteractions}
          />
        )}

        {isCalendarOpen && (
          <JournalCalendarModal
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
            interactions={allInteractions}
          />
        )}

        {isBackupOpen && (
          <VaultBackupModal
            isOpen={isBackupOpen}
            onClose={() => setIsBackupOpen(false)}
            interactions={allInteractions}
          />
        )}

        {pinnedQuote && (
          <QuoteCardModal
            isOpen={Boolean(pinnedQuote)}
            onClose={() => setPinnedQuote(null)}
            quoteText={pinnedQuote}
            sourceTitle={selectedInteraction?.title}
            locationName={selectedInteraction?.location?.name}
            authorProfile={authorProfile}
          />
        )}

        {isCapsuleOpen && (
          <TimeCapsuleModal
            isOpen={isCapsuleOpen}
            onClose={() => setIsCapsuleOpen(false)}
            recentInteractions={allInteractions}
          />
        )}

        {isRitualOpen && (
          <DailyRitualModal
            isOpen={isRitualOpen}
            onClose={() => setIsRitualOpen(false)}
            onSaveRitualAsInquiry={(interaction) => {
              setSelectedInteraction(interaction);
            }}
            userId={user?.uid}
          />
        )}

        {isConstellationOpen && (
          <ConstellationModal
            isOpen={isConstellationOpen}
            onClose={() => setIsConstellationOpen(false)}
            interactions={allInteractions}
            onSelectInteraction={(interaction) => setSelectedInteraction(interaction)}
          />
        )}

        {isAnthologyOpen && (
          <AnthologyModal
            isOpen={isAnthologyOpen}
            onClose={() => setIsAnthologyOpen(false)}
            interactions={allInteractions}
            penName={authorProfile.penName}
            waxSeal={
              authorProfile.waxSeal === 'temple'
                ? '🏛️'
                : authorProfile.waxSeal === 'candle'
                ? '🕯️'
                : authorProfile.waxSeal === 'olive'
                ? '🌿'
                : authorProfile.waxSeal === 'owl'
                ? '🦉'
                : authorProfile.waxSeal === 'compass'
                ? '🧭'
                : '🪶'
            }
          />
        )}

        {isCommandPaletteOpen && (
          <CommandPaletteModal
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            interactions={allInteractions}
            onSelectInteraction={(interaction) => setSelectedInteraction(interaction)}
            onNewInquiry={() => setSelectedInteraction(null)}
            onOpenZen={() => setIsZenModeOpen(true)}
            onOpenConstellation={() => setIsConstellationOpen(true)}
            onOpenRitual={() => setIsRitualOpen(true)}
            onOpenCapsule={() => setIsCapsuleOpen(true)}
            onOpenAnthology={() => setIsAnthologyOpen(true)}
            onOpenSoundscapes={() => setIsSoundscapesOpen(true)}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOpenAnalytics={() => setIsAnalyticsOpen(true)}
            onLockVault={() => setIsVaultLocked(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onToggleThoughtGrammar={() => setThoughtGrammarEnabled((prev) => !prev)}
            onToggleAtmosphere={() => setIsAmbientMotion((prev) => !prev)}
            onOpenProfile={(tab = 'identity') => {
              setProfileInitialTab(tab);
              setIsProfileOpen(true);
            }}
            onOpenSacredGrounds={() => setIsSacredGroundsOpen(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        )}

        {isProfileOpen && (
          <AuthorSanctuaryModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            profile={authorProfile}
            onSaveProfile={handleSaveProfile}
            interactions={allInteractions}
            initialTab={profileInitialTab}
          />
        )}

        {isSacredGroundsOpen && (
          <SacredGroundsModal
            isOpen={isSacredGroundsOpen}
            onClose={() => setIsSacredGroundsOpen(false)}
            interactions={allInteractions}
            onSelectInteraction={(interaction) => setSelectedInteraction(interaction)}
          />
        )}

        {isAdminOpen && (
          <AdminDashboardModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
          />
        )}

        {isNotificationsOpen && (
          <NotificationSettingsModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            authorProfile={authorProfile}
            currentInteraction={selectedInteraction}
          />
        )}
      </React.Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}


