import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, LogOut, CheckCircle, ShieldCheck, PanelLeftClose, PanelLeft, Feather, BarChart2, Lock, Calendar, Archive } from 'lucide-react';

interface NavbarProps {
  onNewReflection: () => void;
  onOpenWalkthrough: () => void;
  onOpenAnalytics: () => void;
  onOpenCalendar: () => void;
  onOpenBackup: () => void;
  onLockVault: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewReflection,
  onOpenWalkthrough,
  onOpenAnalytics,
  onOpenCalendar,
  onOpenBackup,
  onLockVault,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { user, signOutUser } = useAuth();

  const userInitials = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      id="app-navbar"
      className="bg-[#F7F4EE] border-b border-[#E2DDD5] px-4 py-3 sm:px-6 sticky top-0 z-30 transition-colors"
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenCalendar}
            className="inline-flex items-center gap-1 text-[10px] font-sans uppercase tracking-[0.15em] border border-[#E2DDD5] hover:border-[#C4432B] px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#FFFDF9] hover:bg-[#EFECE6] transition-colors text-[#595652] hover:text-[#2B2A28] rounded-sm"
            title="Writing Calendar & Streaks"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C4432B]" />
            <span className="hidden md:inline">Calendar</span>
          </button>

          <button
            onClick={onOpenAnalytics}
            className="inline-flex items-center gap-1 text-[10px] font-sans uppercase tracking-[0.15em] border border-[#E2DDD5] hover:border-[#C4432B] px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#FFFDF9] hover:bg-[#EFECE6] transition-colors text-[#595652] hover:text-[#2B2A28] rounded-sm"
            title="Cognitive Shift & Emotional Analytics"
          >
            <BarChart2 className="w-3.5 h-3.5 text-[#C4432B]" />
            <span className="hidden md:inline">Analytics</span>
          </button>

          <button
            onClick={onOpenBackup}
            className="inline-flex items-center gap-1 text-[10px] font-sans uppercase tracking-[0.15em] border border-[#E2DDD5] hover:border-[#C4432B] px-2 py-1.5 sm:px-2.5 sm:py-2 bg-[#FFFDF9] hover:bg-[#EFECE6] transition-colors text-[#595652] hover:text-[#2B2A28] rounded-sm"
            title="Backup & Restore Vault"
          >
            <Archive className="w-3.5 h-3.5 text-[#595652]" />
            <span className="hidden lg:inline">Backup</span>
          </button>

          <button
            onClick={onLockVault}
            className="inline-flex items-center gap-1 text-[10px] font-sans uppercase tracking-[0.15em] border border-[#E2DDD5] hover:border-[#C4432B] px-2 py-1.5 sm:px-2.5 sm:py-2 bg-[#FFFDF9] hover:bg-[#EFECE6] transition-colors text-[#595652] hover:text-[#2B2A28] rounded-sm"
            title="Lock Journal Vault (Passcode)"
          >
            <Lock className="w-3.5 h-3.5 text-[#2B2A28]" />
            <span className="hidden xl:inline">Lock Vault</span>
          </button>

          <button
            id="walkthrough-nav-btn"
            onClick={onOpenWalkthrough}
            className="inline-flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-[0.15em] border border-[#E2DDD5] hover:border-[#C4432B] px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#FFFDF9] hover:bg-[#EFECE6] transition-colors text-[#595652] hover:text-[#2B2A28] rounded-sm"
            title="View Functional Protocols & Verification"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C4432B]" />
            <span className="hidden sm:inline">Verification</span>
          </button>

          <button
            id="new-reflection-nav-btn"
            onClick={onNewReflection}
            className="inline-flex items-center gap-1.5 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-[10px] font-sans uppercase tracking-[0.18em] px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-200 active:scale-[0.99] rounded-sm font-medium"
            title="Start New Inquiry (⌘N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New Inquiry</span>
          </button>

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
