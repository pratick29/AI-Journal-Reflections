import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Compass,
  Sun,
  BookOpen,
  Headphones,
  Calendar,
  BarChart2,
  Lock,
  Archive,
  Sparkles,
  Maximize2,
  PenTool,
  ArrowRight,
  X,
  User,
  Award,
  Heart,
  MapPin,
  Shield,
  Bell,
} from 'lucide-react';
import { Interaction, PhilosophicalPersona } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
  onSelectInteraction: (interaction: Interaction) => void;
  onNewInquiry: () => void;
  onOpenZen: () => void;
  onOpenConstellation: () => void;
  onOpenRitual: () => void;
  onOpenCapsule: () => void;
  onOpenAnthology: () => void;
  onOpenSoundscapes: () => void;
  onOpenCalendar: () => void;
  onOpenAnalytics: () => void;
  onLockVault: () => void;
  onOpenBackup: () => void;
  onToggleThoughtGrammar: () => void;
  onToggleAtmosphere: () => void;
  onSelectPersona?: (persona: PhilosophicalPersona) => void;
  onOpenProfile?: (tab?: 'identity' | 'ledger' | 'preferences' | 'grounding') => void;
  onOpenSacredGrounds?: () => void;
  onOpenAdmin?: () => void;
  onOpenNotifications?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  interactions,
  onSelectInteraction,
  onNewInquiry,
  onOpenZen,
  onOpenConstellation,
  onOpenRitual,
  onOpenCapsule,
  onOpenAnthology,
  onOpenSoundscapes,
  onOpenCalendar,
  onOpenAnalytics,
  onLockVault,
  onOpenBackup,
  onToggleThoughtGrammar,
  onToggleAtmosphere,
  onSelectPersona,
  onOpenProfile,
  onOpenSacredGrounds,
  onOpenAdmin,
  onOpenNotifications,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commandItems = [
    ...(onOpenNotifications
      ? [
          {
            id: 'cmd_notifications',
            category: 'External',
            title: 'External Notifications (Slack, Discord, Webhooks)',
            shortcut: 'Dispatch',
            icon: <Bell className="w-4 h-4 text-[#C4432B]" />,
            action: () => {
              onOpenNotifications();
              onClose();
            },
          },
        ]
      : []),
    ...(onOpenAdmin
      ? [
          {
            id: 'cmd_admin',
            category: 'Security',
            title: 'Admin Security Dashboard (Roles & Permissions)',
            shortcut: 'Admin',
            icon: <Shield className="w-4 h-4 text-[#C4432B]" />,
            action: () => {
              onOpenAdmin();
              onClose();
            },
          },
        ]
      : []),
    ...(onOpenProfile
      ? [
          {
            id: 'cmd_profile',
            category: 'Sanctuary',
            title: 'Profile & Preferences (Pen Name & Goals)',
            shortcut: 'Profile',
            icon: <User className="w-4 h-4 text-[#C4432B]" />,
            action: () => {
              onOpenProfile('identity');
              onClose();
            },
          },
          {
            id: 'cmd_laurels',
            category: 'Sanctuary',
            title: 'Milestones & Achievements',
            shortcut: 'Badges',
            icon: <Award className="w-4 h-4 text-[#C4432B]" />,
            action: () => {
              onOpenProfile('ledger');
              onClose();
            },
          },
          {
            id: 'cmd_grounding',
            category: 'Sanctuary',
            title: 'Breathing Exercise (4-4-4 Grounding)',
            shortcut: 'Breathe',
            icon: <Heart className="w-4 h-4 text-[#C4432B]" />,
            action: () => {
              onOpenProfile('grounding');
              onClose();
            },
          },
        ]
      : []),
    {
      id: 'cmd_new',
      category: 'Actions',
      title: 'New Journal Entry',
      shortcut: '⌘N',
      icon: <Plus className="w-4 h-4 text-[#C4432B]" />,
      action: () => {
        onNewInquiry();
        onClose();
      },
    },
    {
      id: 'cmd_zen',
      category: 'Actions',
      title: 'Distraction-Free Zen Mode',
      shortcut: 'Zen',
      icon: <Maximize2 className="w-4 h-4 text-[#C4432B]" />,
      action: () => {
        onOpenZen();
        onClose();
      },
    },
    {
      id: 'cmd_constellation',
      category: 'Studio',
      title: 'Idea Constellation Map',
      shortcut: 'Galaxy',
      icon: <Compass className="w-4 h-4 text-[#C4432B]" />,
      action: () => {
        onOpenConstellation();
        onClose();
      },
    },
    ...(onOpenSacredGrounds
      ? [
          {
            id: 'cmd_sacred_grounds',
            category: 'Studio',
            title: 'Places Map (Google Maps Entries)',
            shortcut: 'Maps',
            icon: <MapPin className="w-4 h-4 text-[#C4432B]" />,
            action: () => {
              onOpenSacredGrounds();
              onClose();
            },
          },
        ]
      : []),
    {
      id: 'cmd_rituals',
      category: 'Studio',
      title: 'Daily Rituals (Morning & Evening)',
      shortcut: 'Habits',
      icon: <Sun className="w-4 h-4 text-amber-600" />,
      action: () => {
        onOpenRitual();
        onClose();
      },
    },
    {
      id: 'cmd_capsule',
      category: 'Studio',
      title: 'Time Capsules (Letters to Future Self)',
      shortcut: 'Future',
      icon: <span className="text-sm">🕯️</span>,
      action: () => {
        onOpenCapsule();
        onClose();
      },
    },
    {
      id: 'cmd_anthology',
      category: 'Studio',
      title: 'Export Book / Anthology (PDF)',
      shortcut: 'PDF',
      icon: <BookOpen className="w-4 h-4 text-[#C4432B]" />,
      action: () => {
        onOpenAnthology();
        onClose();
      },
    },
    {
      id: 'cmd_sound',
      category: 'Atmosphere',
      title: 'Ambient Sounds (Rain, Hearth, Library)',
      shortcut: 'Audio',
      icon: <Headphones className="w-4 h-4 text-[#C4432B]" />,
      action: () => {
        onOpenSoundscapes();
        onClose();
      },
    },
    {
      id: 'cmd_calendar',
      category: 'Insights',
      title: 'Writing Calendar & Streaks',
      shortcut: 'Calendar',
      icon: <Calendar className="w-4 h-4 text-[#C4432B]" />,
      action: () => {
        onOpenCalendar();
        onClose();
      },
    },
    {
      id: 'cmd_analytics',
      category: 'Insights',
      title: 'Journal Insights & Analytics',
      shortcut: 'Analytics',
      icon: <BarChart2 className="w-4 h-4 text-[#C4432B]" />,
      action: () => {
        onOpenAnalytics();
        onClose();
      },
    },
    {
      id: 'cmd_grammar',
      category: 'Studio',
      title: 'Thought Clarity Helper (Toggle)',
      shortcut: 'Clarity',
      icon: <PenTool className="w-4 h-4 text-[#C4432B]" />,
      action: () => {
        onToggleThoughtGrammar();
        onClose();
      },
    },
    {
      id: 'cmd_atmosphere',
      category: 'Atmosphere',
      title: 'Animated Background (Toggle)',
      shortcut: 'Canvas',
      icon: <Sparkles className="w-4 h-4 text-[#C4432B]" />,
      action: () => {
        onToggleAtmosphere();
        onClose();
      },
    },
    {
      id: 'cmd_lock',
      category: 'Security',
      title: 'Lock Journal Vault (PIN Protect)',
      shortcut: 'PIN',
      icon: <Lock className="w-4 h-4 text-[#2B2A28]" />,
      action: () => {
        onLockVault();
        onClose();
      },
    },
    {
      id: 'cmd_backup',
      category: 'Security',
      title: 'Backup & Restore Vault (Export JSON)',
      shortcut: 'JSON',
      icon: <Archive className="w-4 h-4 text-[#595652]" />,
      action: () => {
        onOpenBackup();
        onClose();
      },
    },
    // Personas
    {
      id: 'persona_marcus',
      category: 'The Lyceum',
      title: 'Consult Marcus Aurelius (Stoic Duty & Equanimity)',
      shortcut: 'Stoic',
      icon: <span className="text-sm">🏛️</span>,
      action: () => {
        onSelectPersona?.('marcus_aurelius');
        onClose();
      },
    },
    {
      id: 'persona_jung',
      category: 'The Lyceum',
      title: 'Consult Carl Gustav Jung (Shadow Work & Archetypes)',
      shortcut: 'Shadow',
      icon: <span className="text-sm">🕯️</span>,
      action: () => {
        onSelectPersona?.('carl_jung');
        onClose();
      },
    },
    {
      id: 'persona_socrates',
      category: 'The Lyceum',
      title: 'Consult Socrates (Dialectical Cross-Examination)',
      shortcut: 'Dialectic',
      icon: <span className="text-sm">🏺</span>,
      action: () => {
        onSelectPersona?.('socrates');
        onClose();
      },
    },
    {
      id: 'persona_beauvoir',
      category: 'The Lyceum',
      title: 'Consult Simone de Beauvoir (Existential Agency & Ethics)',
      shortcut: 'Agency',
      icon: <span className="text-sm">✒️</span>,
      action: () => {
        onSelectPersona?.('simone_de_beauvoir');
        onClose();
      },
    },
    {
      id: 'persona_watts',
      category: 'The Lyceum',
      title: 'Consult Alan Watts (Zen Levity & Non-Dualism)',
      shortcut: 'Zen',
      icon: <span className="text-sm">🌊</span>,
      action: () => {
        onSelectPersona?.('alan_watts');
        onClose();
      },
    },
  ];

  // Search filtered results
  const q = query.toLowerCase().trim();

  const matchingCommands = commandItems.filter(
    (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
  );

  const matchingInquiries = interactions
    .filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.summary && i.summary.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
    )
    .slice(0, 8);

  const totalResults = [...matchingCommands, ...matchingInquiries.map((i) => ({ ...i, isInteraction: true }))];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalResults.length) % Math.max(1, totalResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = totalResults[selectedIndex];
      if (current) {
        if ('isInteraction' in current) {
          onSelectInteraction(current as unknown as Interaction);
          onClose();
        } else if ('action' in current && typeof current.action === 'function') {
          current.action();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-[#1A1918]/60 backdrop-blur-xs font-serif">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] shadow-2xl w-full max-w-xl rounded-xs overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#E2DDD5] bg-[#F7F4EE]">
          <Search className="w-4 h-4 text-[#8A8478] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, tool, or search inquiries... (e.g. 'Marcus', 'Zen', 'Rain')"
            className="w-full bg-transparent text-sm font-serif text-[#2B2A28] placeholder-[#8A8478]/70 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 border border-[#E2DDD5] bg-[#EFECE6] text-[9px] font-mono text-[#8A8478] rounded-xs ml-2">
            ESC
          </kbd>
          <button onClick={onClose} className="p-1 hover:bg-[#EFECE6] text-[#8A8478] ml-1 rounded-xs">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#E2DDD5]/40">
          {matchingCommands.length > 0 && (
            <div className="pb-2 space-y-0.5">
              <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] px-2 py-1 block font-semibold">
                Commands &amp; Tools
              </span>
              {matchingCommands.map((cmd, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3 py-2 rounded-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#C4432B]/10 text-[#2B2A28]' : 'text-[#595652] hover:bg-[#F7F4EE]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 flex items-center justify-center">{cmd.icon}</div>
                      <span className="text-xs font-serif">{cmd.title}</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#8A8478] uppercase px-1.5 py-0.5 border border-[#E2DDD5] bg-[#FFFDF9] rounded-xs">
                      {cmd.shortcut}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {matchingInquiries.length > 0 && (
            <div className="pt-2 space-y-0.5">
              <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] px-2 py-1 block font-semibold">
                Matching Inquiries ({matchingInquiries.length})
              </span>
              {matchingInquiries.map((item, idx) => {
                const actualIndex = matchingCommands.length + idx;
                const isSelected = selectedIndex === actualIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectInteraction(item);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(actualIndex)}
                    className={`px-3 py-2 rounded-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#C4432B]/10 text-[#2B2A28]' : 'text-[#595652] hover:bg-[#F7F4EE]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs">📜</span>
                      <div>
                        <div className="text-xs font-serif font-medium text-[#2B2A28] line-clamp-1">
                          {item.title}
                        </div>
                        <div className="text-[10px] font-sans text-[#8A8478]">
                          {new Date(item.createdAt).toLocaleDateString()} • {item.category}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8A8478]" />
                  </div>
                );
              })}
            </div>
          )}

          {totalResults.length === 0 && (
            <div className="py-8 text-center text-xs text-[#8A8478] font-serif">
              No matching commands or inquiries found for "{query}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#E2DDD5] bg-[#F7F4EE] text-[9px] font-sans text-[#8A8478] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigate with <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
            <span>•</span>
            <span>Select with <kbd className="font-mono">Enter</kbd></span>
          </div>
          <span>⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
};
