import React, { useState, useRef } from 'react';
import { X, Quote, Copy, Check, Feather, Download, Image as ImageIcon, Sparkles, MapPin } from 'lucide-react';
import { AuthorProfile, WAX_SEALS } from '../types';

interface QuoteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteText: string;
  sourceTitle?: string;
  locationName?: string;
  authorProfile?: AuthorProfile;
}

export const QuoteCardModal: React.FC<QuoteCardModalProps> = ({
  isOpen,
  onClose,
  quoteText,
  sourceTitle,
  locationName,
  authorProfile,
}) => {
  const [theme, setTheme] = useState<'cream' | 'terracotta' | 'charcoal' | 'sage'>('cream');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentSeal = WAX_SEALS.find((s) => s.id === authorProfile?.waxSeal)?.symbol || '🪶';
  const authorName = authorProfile?.penName || 'Anonymous Author';

  const themeConfig = {
    cream: {
      bg: '#FAF7F0',
      text: '#2B2A28',
      accent: '#C4432B',
      border: '#E2DDD5',
      secondary: '#6E6A64',
      badgeBg: '#EFECE6',
    },
    terracotta: {
      bg: '#C4432B',
      text: '#FFFDF9',
      accent: '#F9D9D2',
      border: '#A8351F',
      secondary: '#F5C4BA',
      badgeBg: '#A8351F',
    },
    charcoal: {
      bg: '#1E1C1A',
      text: '#F3EFE6',
      accent: '#E87A64',
      border: '#3D3833',
      secondary: '#A8A298',
      badgeBg: '#2B2824',
    },
    sage: {
      bg: '#F2F5F0',
      text: '#253325',
      accent: '#4B6B4B',
      border: '#D0DCD0',
      secondary: '#5C745C',
      badgeBg: '#E1EBE1',
    },
  };

  const activeTheme = themeConfig[theme];

  // Generate high-resolution 1200x1200 PNG canvas
  const generateCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const size = 1200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const t = activeTheme;

    // 1. Background Fill
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, size, size);

    // Subtle decorative textured noise simulation
    ctx.fillStyle = t.accent;
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      ctx.fillRect(rx, ry, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // 2. Borders & Corner Filigrees
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, size - 120, size - 120);

    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(76, 76, size - 152, size - 152);

    // Corner Accents
    const cornerSize = 24;
    ctx.fillStyle = t.accent;
    ctx.fillRect(72, 72, cornerSize, 4);
    ctx.fillRect(72, 72, 4, cornerSize);
    ctx.fillRect(size - 72 - cornerSize, 72, cornerSize, 4);
    ctx.fillRect(size - 76, 72, 4, cornerSize);
    ctx.fillRect(72, size - 76, cornerSize, 4);
    ctx.fillRect(72, size - 72 - cornerSize, 4, cornerSize);
    ctx.fillRect(size - 72 - cornerSize, size - 76, cornerSize, 4);
    ctx.fillRect(size - 76, size - 72 - cornerSize, 4, cornerSize);

    // 3. Top Header: Brand & Seal
    ctx.fillStyle = t.accent;
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '5px';
    ctx.textAlign = 'center';
    ctx.fillText('PERSONAL GEMINI JOURNAL', size / 2, 160);

    ctx.fillStyle = t.secondary;
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText('Mindful Editorial Realization', size / 2, 195);

    // Divider
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size / 2 - 120, 225);
    ctx.lineTo(size / 2 + 120, 225);
    ctx.stroke();

    // 4. Large Quotation Mark
    ctx.fillStyle = t.accent;
    ctx.font = 'italic 120px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('“', size / 2, 330);

    // 5. Wrap Quote Text
    ctx.fillStyle = t.text;
    ctx.font = 'italic 42px Georgia, serif';
    ctx.textAlign = 'center';
    const maxWidth = size - 320;
    const lineHeight = 64;

    const words = quoteText.replace(/\n+/g, ' ').split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const maxLines = 8;
    const renderedLines = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      renderedLines[maxLines - 1] += '…';
    }

    const startY = 430 + (4 - Math.min(4, renderedLines.length)) * 25;
    for (let i = 0; i < renderedLines.length; i++) {
      ctx.fillText(renderedLines[i], size / 2, startY + i * lineHeight);
    }

    // 6. Bottom Metadata & Seal
    const footerY = size - 170;

    // Divider
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, footerY - 50);
    ctx.lineTo(size - 120, footerY - 50);
    ctx.stroke();

    // Seal & Pen Name
    ctx.font = '40px serif';
    ctx.fillText(currentSeal, size / 2, footerY);

    ctx.fillStyle = t.text;
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(authorName.toUpperCase(), size / 2, footerY + 45);

    // Location / Date
    const locationTag = locationName ? `📍 ${locationName} · ` : '';
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    ctx.fillStyle = t.secondary;
    ctx.font = '20px Georgia, serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(`${locationTag}${dateStr}`, size / 2, footerY + 80);

    return canvas;
  };

  const handleDownloadPNG = () => {
    setIsGeneratingImage(true);
    try {
      const canvas = generateCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `quote-card-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to export quote card:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyImage = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = generateCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2000);
        } catch {
          // Fallback to text copy
          handleCopyText();
        }
      });
    } catch {
      handleCopyText();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyText = () => {
    const locationStr = locationName ? ` [${locationName}]` : '';
    const text = `"${quoteText}"\n\n— ${authorName}${locationStr}\n(Personal Gemini Journal)`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1918]/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-4 border-t-[#C4432B] max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 rounded-xs my-8 max-h-[92vh] overflow-y-auto font-serif">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C4432B]/10 text-[#C4432B] rounded-xs border border-[#C4432B]/20">
              <Quote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-sans uppercase tracking-[0.25em] font-bold text-[#C4432B]">
                EDITORIAL SHARE STUDIO
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-[#2B2A28] font-light">
                Shareable Quote Card
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#EFECE6] transition-colors rounded-xs"
            aria-label="Close quote card studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Aesthetic Selector */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
            Card Palette:
          </span>
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'cream', label: 'Parchment' },
                { id: 'terracotta', label: 'Terracotta' },
                { id: 'charcoal', label: 'Obsidian' },
                { id: 'sage', label: 'Sage' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`px-3 py-1 text-[10px] font-sans uppercase tracking-wider border rounded-xs transition-colors ${
                  theme === t.id
                    ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28] font-semibold'
                    : 'bg-[#FFFDF9] text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Card Preview Box */}
        <div
          ref={cardRef}
          style={{
            backgroundColor: activeTheme.bg,
            borderColor: activeTheme.border,
            color: activeTheme.text,
          }}
          className="p-7 sm:p-9 border-2 shadow-lg space-y-6 rounded-xs transition-all relative overflow-hidden"
        >
          {/* Top Header Rule */}
          <div
            style={{ borderColor: activeTheme.border }}
            className="flex items-center justify-between border-b pb-3"
          >
            <div className="flex items-center gap-2">
              <Feather style={{ color: activeTheme.accent }} className="w-4 h-4" />
              <span className="text-[9px] font-sans uppercase tracking-[0.25em] font-bold">
                Personal Gemini Journal
              </span>
            </div>
            <span style={{ color: activeTheme.accent }} className="font-script text-lg">
              {currentSeal}
            </span>
          </div>

          {/* Quote Body */}
          <blockquote className="text-lg sm:text-xl font-serif font-light leading-relaxed italic text-center py-2">
            "{quoteText}"
          </blockquote>

          {/* Footer Metadata */}
          <div
            style={{ borderColor: activeTheme.border }}
            className="border-t pt-3 flex items-center justify-between text-[10px] font-sans uppercase tracking-wider opacity-80"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-bold">{authorName}</span>
              {locationName && (
                <span className="flex items-center gap-1 text-[9px] opacity-75 border-l border-current/30 pl-1.5">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{locationName}</span>
                </span>
              )}
            </div>
            <span>
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Export & Download Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2DDD5]">
          <span className="text-[10px] font-sans text-[#8A8478]">
            High-Resolution 1200×1200 PNG (Instagram, X, or Keepsake)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-2 border border-[#E2DDD5] hover:border-[#C4432B] text-[#595652] hover:text-[#2B2A28] text-[10px] font-sans uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1.5"
              title="Copy quote text to clipboard"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Text Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={isGeneratingImage}
              className="px-3 py-2 border border-[#E2DDD5] hover:border-[#C4432B] text-[#595652] hover:text-[#2B2A28] text-[10px] font-sans uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1.5"
              title="Copy PNG image to clipboard"
            >
              {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span>{copiedImage ? 'Image Copied' : 'Copy Image'}</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={isGeneratingImage}
              className="px-4 py-2 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-[10px] font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1.5 shadow-sm"
              title="Download high-resolution image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
