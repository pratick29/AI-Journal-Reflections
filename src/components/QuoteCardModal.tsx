import React, { useState } from 'react';
import { X, Quote, Copy, Check, Feather, Printer } from 'lucide-react';

interface QuoteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteText: string;
  sourceTitle?: string;
}

export const QuoteCardModal: React.FC<QuoteCardModalProps> = ({
  isOpen,
  onClose,
  quoteText,
  sourceTitle,
}) => {
  const [theme, setTheme] = useState<'cream' | 'terracotta' | 'charcoal'>('cream');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const themeStyles = {
    cream: 'bg-[#FFFDF9] border-[#E2DDD5] text-[#2B2A28] paper-texture',
    terracotta: 'bg-[#C4432B] border-[#A8351F] text-[#F7F4EE]',
    charcoal: 'bg-[#2B2A28] border-[#1A1918] text-[#F7F4EE]',
  };

  const handleCopyText = () => {
    const text = `"${quoteText}"\n\n— Personal Gemini Journal${sourceTitle ? ` (${sourceTitle})` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2A28]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-4 border-t-[#C4432B] max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-6 rounded-xs my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C4432B]/10 text-[#C4432B] rounded-xs">
              <Quote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.22em] font-bold text-[#C4432B]">
                Editorial Specimen
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-[#2B2A28] font-light">
                Quote Card Studio
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#EFECE6] transition-colors rounded-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme selector */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#8A8478]">
            Card Aesthetic:
          </span>
          <div className="flex items-center gap-2">
            {(['cream', 'terracotta', 'charcoal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1 text-[10px] font-sans uppercase tracking-wider border rounded-xs transition-colors ${
                  theme === t ? 'bg-[#2B2A28] text-[#F7F4EE] font-bold' : 'bg-[#FFFDF9] text-[#595652] border-[#E2DDD5]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Art-Directed Quote Card Preview */}
        <div className={`p-8 border-2 shadow-md space-y-6 rounded-xs transition-all ${themeStyles[theme]}`}>
          <div className="flex items-center justify-between border-b border-current/20 pb-3">
            <div className="flex items-center gap-2">
              <Feather className="w-4 h-4 text-[#C4432B]" />
              <span className="text-[9px] font-sans uppercase tracking-[0.25em] font-bold">
                PERSONAL GEMINI JOURNAL
              </span>
            </div>
            <span className="font-script text-base opacity-80">editorial excerpt</span>
          </div>

          <blockquote className="text-xl sm:text-2xl font-serif font-light leading-relaxed italic">
            "{quoteText}"
          </blockquote>

          <div className="border-t border-current/20 pt-3 flex items-center justify-between text-[10px] font-sans uppercase tracking-widest opacity-70">
            <span>{sourceTitle || 'Inquiry Reflection'}</span>
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[#E2DDD5] pt-4 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-[#E2DDD5] text-xs font-sans uppercase tracking-widest text-[#595652] hover:text-[#2B2A28] hover:border-[#C4432B] transition-colors rounded-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Specimen</span>
          </button>

          <button
            onClick={handleCopyText}
            className="px-5 py-2 bg-[#2B2A28] text-[#F7F4EE] text-xs font-sans uppercase tracking-widest font-semibold hover:bg-[#C4432B] transition-colors rounded-xs flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Quote Text'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
