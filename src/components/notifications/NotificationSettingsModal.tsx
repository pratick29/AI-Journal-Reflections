import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ExternalLink,
  Shield,
  Sparkles,
  Zap,
  Globe,
  RefreshCw,
  Mail,
} from 'lucide-react';
import {
  NotificationChannel,
  NotificationTrigger,
  NotificationChannelConfig,
  Interaction,
  AuthorProfile,
} from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorProfile?: AuthorProfile;
  currentInteraction?: Interaction | null;
}

const DEFAULT_CONFIG: NotificationChannelConfig = {
  slackWebhookUrl: '',
  discordWebhookUrl: '',
  emailWebhookUrl: '',
  enabledChannels: {
    slack: false,
    discord: false,
    emailWebhook: false,
  },
  enabledTriggers: {
    socratic_breakthrough: true,
    stoic_equanimity: true,
    shadow_confrontation: true,
    milestone: true,
    manual_dispatch: true,
  },
};

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  authorProfile,
  currentInteraction,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'channels' | 'triggers' | 'schema' | 'dispatch'>('channels');
  const [config, setConfig] = useState<NotificationChannelConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('journal_notification_config');
        if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      } catch (err) {
        console.warn('Failed to load notification config:', err);
      }
    }
    return DEFAULT_CONFIG;
  });

  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel>('slack');
  const [selectedTrigger, setSelectedTrigger] = useState<NotificationTrigger>('socratic_breakthrough');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; schema?: any } | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('journal_notification_config', JSON.stringify(config));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleTestDispatch = async (dryRun = true) => {
    if (!user) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const idToken = await user.getIdToken();
      const webhookUrl =
        selectedChannel === 'slack' ? config.slackWebhookUrl :
        selectedChannel === 'discord' ? config.discordWebhookUrl : config.emailWebhookUrl;

      const endpoint = dryRun ? '/api/notify/test' : '/api/notify';

      if (!dryRun && !webhookUrl) {
        setTestResult({
          success: false,
          message: `Please configure a valid ${selectedChannel.toUpperCase()} webhook URL first.`,
        });
        setIsTesting(false);
        return;
      }

      const dummyExcerpt =
        currentInteraction?.messages.find((m) => m.role === 'user')?.content.slice(0, 300) ||
        'When we examine the quiet assumptions behind our daily anxieties, we uncover the freedom to respond with virtue rather than impulse.';

      const dummyInsight =
        currentInteraction?.cognitiveAnalysis?.coreAxiom ||
        currentInteraction?.messages.find((m) => m.role === 'assistant')?.content.slice(0, 300) ||
        'The author dissected the dichotomy of control, transforming acute friction into moral composure.';

      const payload = {
        channel: selectedChannel,
        webhookUrl: webhookUrl || 'https://hooks.slack.com/services/SIMULATED/DRY_RUN/TEST',
        trigger: selectedTrigger,
        author: {
          penName: authorProfile?.penName || user.displayName || 'The Reflective Author',
          waxSeal: authorProfile?.waxSeal || '🪶',
        },
        manuscript: {
          interactionId: currentInteraction?.id || `int_${Date.now()}`,
          title: currentInteraction?.title || 'Inquiry on Deliberate Intent & Socratic Courage',
          category: currentInteraction?.category || 'reflection',
          locus: currentInteraction?.location ? {
            name: currentInteraction.location.name,
            address: currentInteraction.location.address,
          } : { name: 'The Stoa Poikile, Athens' },
          excerpt: dummyExcerpt,
          socraticInsight: dummyInsight,
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setTestResult({
        success: true,
        message: dryRun
          ? `Schema preview generated successfully for ${selectedChannel.toUpperCase()}!`
          : `Live dispatch dispatched to ${data.destinationHost}!`,
        schema: data.schema,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Dispatch failed: ${err.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1A1918]/70 backdrop-blur-xs font-serif">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xs overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] flex items-center justify-between bg-[#F7F4EE] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-[#C4432B]/10 border border-[#C4432B]/20 flex items-center justify-center text-[#C4432B]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-medium text-[#2B2A28]">
                  External Notifications
                </h2>
                <span className="text-[9px] font-sans uppercase tracking-widest px-2 py-0.5 bg-[#C4432B]/10 text-[#C4432B] border border-[#C4432B]/20 rounded-xs font-bold">
                  Slack / Discord / Webhook
                </span>
              </div>
              <p className="text-[10px] font-sans text-[#8A8478] tracking-wide">
                Slack, Discord, Email &amp; Webhook integrations for your journal entries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveConfig}
              className="px-3.5 py-1.5 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-[10px] font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1.5"
            >
              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved!' : 'Save Config'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#EFECE6] text-[#8A8478] hover:text-[#2B2A28] rounded-xs"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2DDD5] bg-[#EFECE6]/60 px-6 text-xs font-sans uppercase tracking-[0.18em] shrink-0">
          <button
            onClick={() => setActiveTab('channels')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'channels'
                ? 'border-b-[#C4432B] text-[#2B2A28] font-bold bg-[#FFFDF9]'
                : 'border-b-transparent text-[#595652] hover:text-[#2B2A28]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#C4432B]" />
            <span>Channels</span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'triggers'
                ? 'border-b-[#C4432B] text-[#2B2A28] font-bold bg-[#FFFDF9]'
                : 'border-b-transparent text-[#595652] hover:text-[#2B2A28]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>When to Send</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'border-b-[#C4432B] text-[#2B2A28] font-bold bg-[#FFFDF9]'
                : 'border-b-transparent text-[#595652] hover:text-[#2B2A28]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#C4432B]" />
            <span>Payload Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dispatch'
                ? 'border-b-[#C4432B] text-[#2B2A28] font-bold bg-[#FFFDF9]'
                : 'border-b-transparent text-[#595652] hover:text-[#2B2A28]'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-[#C4432B]" />
            <span>Send &amp; Test</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FBF9F5] space-y-6">
          {/* TAB 1: CHANNELS */}
          {activeTab === 'channels' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-4 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💬</span>
                    <h3 className="text-sm font-serif font-semibold text-[#2B2A28]">Slack Incoming Webhook</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabledChannels.slack}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          enabledChannels: { ...config.enabledChannels, slack: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#C4432B]"></div>
                  </label>
                </div>
                <p className="text-xs font-serif text-[#595652]">
                  Dispatches Socratic reflections formatted with official <strong>Slack Block Kit</strong> cards, author wax seal, and locus badges.
                </p>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/T.../B.../..."
                  value={config.slackWebhookUrl || ''}
                  onChange={(e) => setConfig({ ...config, slackWebhookUrl: e.target.value })}
                  className="w-full text-xs font-mono p-2 bg-[#F7F4EE] border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B]"
                />
              </div>

              <div className="p-4 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎮</span>
                    <h3 className="text-sm font-serif font-semibold text-[#2B2A28]">Discord Webhook</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabledChannels.discord}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          enabledChannels: { ...config.enabledChannels, discord: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#C4432B]"></div>
                  </label>
                </div>
                <p className="text-xs font-serif text-[#595652]">
                  Dispatches terracotta-bordered <strong>Rich Embeds</strong> featuring author identity, philosophical category, and key insight excerpts.
                </p>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/.../..."
                  value={config.discordWebhookUrl || ''}
                  onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
                  className="w-full text-xs font-mono p-2 bg-[#F7F4EE] border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B]"
                />
              </div>

              <div className="p-4 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#C4432B]" />
                    <h3 className="text-sm font-serif font-semibold text-[#2B2A28]">Email / Custom Webhook Relay</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabledChannels.emailWebhook}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          enabledChannels: { ...config.enabledChannels, emailWebhook: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#C4432B]"></div>
                  </label>
                </div>
                <p className="text-xs font-serif text-[#595652]">
                  Relays standard JSON payloads to email services (Zapier, Make, Resend, or SendGrid webhooks) for automated daily digests.
                </p>
                <input
                  type="url"
                  placeholder="https://hook.eu1.make.com/... or https://api.resend.com/..."
                  value={config.emailWebhookUrl || ''}
                  onChange={(e) => setConfig({ ...config, emailWebhookUrl: e.target.value })}
                  className="w-full text-xs font-mono p-2 bg-[#F7F4EE] border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B]"
                />
              </div>

              <div className="p-3 bg-[#EFECE6]/70 border border-[#E2DDD5] text-[11px] font-serif text-[#595652] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#C4432B] shrink-0" />
                <span>
                  <strong>Security Guarantee:</strong> Webhook URLs are stored exclusively in your local configuration. Requests are verified and dispatched over HTTPS with SSRF protection.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: TRIGGERS */}
          {activeTab === 'triggers' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <p className="text-xs font-serif text-[#595652]">
                Configure which Socratic and psychological entry classifications qualify for automatic external notifications:
              </p>

              {[
                {
                  id: 'socratic_breakthrough',
                  title: '💡 Socratic Breakthroughs',
                  desc: 'Triggered when the dialogue successfully identifies and dismantles a deep unexamined dogma or uncovers a core axiom.',
                },
                {
                  id: 'stoic_equanimity',
                  title: '🏛️ Stoic Equanimity & Amor Fati',
                  desc: 'Triggered when an obstacle is reframed into virtuous agency or emotional friction resolves into radical acceptance.',
                },
                {
                  id: 'shadow_confrontation',
                  title: '🕯️ Jungian Shadow Integration',
                  desc: 'Triggered when subconscious projections, suppressed friction, or archetypal tensions are candidly examined.',
                },
                {
                  id: 'milestone',
                  title: '🏆 Literary & Socratic Milestones',
                  desc: 'Triggered upon unlocking sealed time capsules, generating memoirs, or reaching significant multi-day writing streaks.',
                },
                {
                  id: 'manual_dispatch',
                  title: '🪶 Manual Author Dispatch',
                  desc: 'Allows instant, on-demand dispatch directly from the Manuscript Desk or Archive entries.',
                },
              ].map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xs flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-xs font-serif font-bold text-[#2B2A28]">{t.title}</h4>
                    <p className="text-xs font-serif text-[#595652] mt-0.5">{t.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={(config.enabledTriggers as any)[t.id]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          enabledTriggers: {
                            ...config.enabledTriggers,
                            [t.id]: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#C4432B]"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SCHEMA & DIRECTIVE */}
          {activeTab === 'schema' && (
            <div className="space-y-5 max-w-2xl mx-auto text-xs">
              <div className="p-4 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xs space-y-3">
                <div className="flex items-center gap-2 text-[#C4432B]">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="font-serif font-bold text-sm text-[#2B2A28]">Active AI Notification API Directive</h3>
                </div>
                <p className="font-serif text-[#595652]">
                  This directive is injected into Gemini’s system instructions across every philosophical inquiry:
                </p>
                <div className="bg-[#1A1918] text-[#F7F4EE] p-3 rounded-xs font-mono text-[11px] leading-relaxed overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{`EXTERNAL NOTIFICATION API & SCHEMA DIRECTIVE:
- The system supports secure external dispatches (Slack Block Kit, Discord Rich Embeds, and Webhook schemas) when significant philosophical breakthroughs or milestones are discovered.
- Trigger classes: 'socratic_breakthrough' (dismantling dogmas), 'stoic_equanimity' (dichotomy of control/amor fati), 'shadow_confrontation' (Jungian integration), 'milestone' (streaks/capsules), and 'manual_dispatch'.
- SECURITY & CREDENTIAL ISOLATION: NEVER output, request, or echo incoming webhook URLs, Bearer tokens, or API secrets. Authentication credentials are strictly managed server-side.
- Any summarized dispatch payload must prioritize authentic author growth and epistemic humility over superficial metrics.`}</pre>
                </div>
              </div>

              <div className="p-4 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xs space-y-2">
                <h3 className="font-serif font-bold text-sm text-[#2B2A28]">Standard JSON Webhook Payload Schema</h3>
                <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3 rounded-xs font-mono text-[10px] text-[#2B2A28] overflow-x-auto">
                  <pre>{JSON.stringify(
                    {
                      eventId: "evt_1788612345678",
                      timestamp: "2026-09-05T20:30:00.000Z",
                      trigger: "socratic_breakthrough",
                      channel: "slack",
                      author: {
                        penName: "The Epistemic Author",
                        waxSeal: "🪶",
                        uid: "auth_user_123"
                      },
                      manuscript: {
                        interactionId: "int_sample_abc",
                        title: "On Socratic Courage and Unexamined Dogmas",
                        category: "reflection",
                        locus: {
                          name: "The Stoa Poikile, Athens",
                          address: "Agora of Athens, Greece"
                        },
                        excerpt: "When we strip away the need for external validation, what remains is the deliberate practice of self-examination.",
                        socraticInsight: "The author dismantled an unexamined premise regarding external praise."
                      }
                    },
                    null,
                    2
                  )}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISPATCH & TEST */}
          {activeTab === 'dispatch' && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="p-4 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xs space-y-4">
                <h3 className="font-serif font-bold text-sm text-[#2B2A28]">Test Dispatch &amp; Schema Simulator</h3>
                <p className="text-xs font-serif text-[#595652]">
                  Verify the schema transformation and dispatch logic. You can perform a <strong>Dry-Run</strong> (no live URL required) or a <strong>Live Dispatch</strong> to your configured webhook.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-serif">
                  <div>
                    <label className="block text-[9px] font-sans uppercase tracking-wider text-[#8A8478] mb-1 font-bold">
                      Select Target Channel
                    </label>
                    <select
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value as NotificationChannel)}
                      className="w-full p-2 bg-[#F7F4EE] border border-[#E2DDD5] rounded-xs focus:outline-none"
                    >
                      <option value="slack">Slack (Block Kit)</option>
                      <option value="discord">Discord (Rich Embed)</option>
                      <option value="email_webhook">Email / Webhook (JSON)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-sans uppercase tracking-wider text-[#8A8478] mb-1 font-bold">
                      Simulate Entry Trigger
                    </label>
                    <select
                      value={selectedTrigger}
                      onChange={(e) => setSelectedTrigger(e.target.value as NotificationTrigger)}
                      className="w-full p-2 bg-[#F7F4EE] border border-[#E2DDD5] rounded-xs focus:outline-none"
                    >
                      <option value="socratic_breakthrough">💡 Socratic Breakthrough</option>
                      <option value="stoic_equanimity">🏛️ Stoic Equanimity</option>
                      <option value="shadow_confrontation">🕯️ Shadow Confrontation</option>
                      <option value="milestone">🏆 Literary Milestone</option>
                      <option value="manual_dispatch">🪶 Manual Dispatch</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleTestDispatch(true)}
                    disabled={isTesting}
                    className="px-4 py-2 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-xs font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1.5"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Code2 className="w-3.5 h-3.5" />}
                    <span>Preview Formatted Schema (Dry-Run)</span>
                  </button>

                  <button
                    onClick={() => handleTestDispatch(false)}
                    disabled={isTesting}
                    className="px-4 py-2 bg-[#C4432B] hover:bg-[#A9341F] text-[#F7F4EE] text-xs font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1.5"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Live Dispatch</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-4 border rounded-xs space-y-2 text-xs font-serif ${
                    testResult.success
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{testResult.message}</span>
                  </div>

                  {testResult.schema && (
                    <div className="bg-[#1A1918] text-[#F7F4EE] p-3 rounded-xs font-mono text-[10px] overflow-x-auto max-h-60 mt-2">
                      <pre>{JSON.stringify(testResult.schema, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
