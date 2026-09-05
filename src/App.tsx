import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { HistoryList } from './components/HistoryList';
import { JournalEditor } from './components/JournalEditor';
import { TestWalkthroughModal } from './components/TestWalkthroughModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { VaultLockModal } from './components/VaultLockModal';
import { JournalCalendarModal } from './components/JournalCalendarModal';
import { VaultBackupModal } from './components/VaultBackupModal';
import { QuoteCardModal } from './components/QuoteCardModal';
import { ZenMode } from './components/editor/ZenMode';
import { AmbientCanvas } from './components/common/AmbientCanvas';
import { SoundscapePlayer } from './components/common/SoundscapePlayer';
import { Interaction } from './types';
import { subscribeUserInteractions } from './firebase/interactions';
import { Loader2 } from 'lucide-react';

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
          />
        </div>
      </main>

      {/* Editorial System Status Footer */}
      <footer className="h-8 sm:h-9 border-t border-[#E5E0D8] flex items-center px-4 sm:px-6 justify-between text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.18em] text-[#8C857B] bg-[#F4F0E8]/60 shrink-0">
        <span className="truncate max-w-[200px] sm:max-w-none">Firestore Isolated · us-central1</span>
        <span className="hidden sm:inline">Engine: Gemini 3.6 Flash</span>
        <span className="truncate">Encryption: AES-256</span>
      </footer>

      {/* Security & Test Walkthrough Modal */}
      <TestWalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />

      {/* Cognitive Shift & Emotional Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        interactions={allInteractions}
      />

      {/* Philosophical Writing Calendar & Streaks Modal */}
      <JournalCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        interactions={allInteractions}
      />

      {/* Vault JSON Backup & Restore Modal */}
      <VaultBackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        interactions={allInteractions}
      />

      {/* Editorial Quote Card Specimen Modal */}
      <QuoteCardModal
        isOpen={Boolean(pinnedQuote)}
        onClose={() => setPinnedQuote(null)}
        quoteText={pinnedQuote || ''}
        sourceTitle={selectedInteraction?.title}
      />

      {/* Zen Distraction-Free Writing Studio */}
      <ZenMode
        isOpen={isZenModeOpen}
        onClose={() => setIsZenModeOpen(false)}
        promptInput={zenPromptInput}
        setPromptInput={setZenPromptInput}
        onSubmitInquiry={() => {
          // Zen mode inquiry submission triggers main prompt
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


