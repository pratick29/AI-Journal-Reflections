import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../../types';
import { Sparkles, Copy, CheckCheck, Quote, HelpCircle, HeartHandshake } from 'lucide-react';

interface DialogueStreamProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onPinQuote?: (quoteText: string) => void;
  onSelectPassageAction?: (action: 'challenge' | 'unpack' | 'marginalia', selectedText: string) => void;
}

export const DialogueStream: React.FC<DialogueStreamProps> = ({
  messages,
  isGenerating,
  onPinQuote,
  onSelectPassageAction,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTextSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 5) {
      const text = sel.toString().trim();
      setSelectedText(text);
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 40,
      });
    } else {
      setSelectionPos(null);
      setSelectedText('');
    }
  };

  if (messages.length === 0) return null;

  return (
    <div className="space-y-8 py-4 relative" onMouseUp={handleTextSelection}>
      {/* Floating Inline Text Selection Popover Toolbar */}
      {selectionPos && selectedText && onSelectPassageAction && (
        <div
          style={{ left: `${selectionPos.x}px`, top: `${selectionPos.y}px` }}
          className="fixed z-50 -translate-x-1/2 bg-[#2B2A28] text-[#F7F4EE] shadow-xl px-3 py-1.5 rounded-xs flex items-center gap-2 text-[10px] font-sans uppercase tracking-wider animate-in fade-in zoom-in-95 duration-150 border border-[#C4432B]"
        >
          <button
            onClick={() => {
              onSelectPassageAction('challenge', selectedText);
              setSelectionPos(null);
            }}
            className="hover:text-[#C4432B] transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-[#C4432B]" />
            <span>Challenge</span>
          </button>
          <span className="opacity-30">|</span>
          <button
            onClick={() => {
              onSelectPassageAction('unpack', selectedText);
              setSelectionPos(null);
            }}
            className="hover:text-[#C4432B] transition-colors flex items-center gap-1"
          >
            <HeartHandshake className="w-3 h-3 text-[#C4432B]" />
            <span>Unpack</span>
          </button>
          {onPinQuote && (
            <>
              <span className="opacity-30">|</span>
              <button
                onClick={() => {
                  onPinQuote(selectedText);
                  setSelectionPos(null);
                }}
                className="hover:text-[#C4432B] transition-colors flex items-center gap-1"
              >
                <Quote className="w-3 h-3 text-[#C4432B]" />
                <span>Quote</span>
              </button>
            </>
          )}
        </div>
      )}

      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const turnNumber = String(index + 1).padStart(2, '0');

        return (
          <div
            key={msg.id || index}
            className={`space-y-3 transition-all ${
              isUser ? 'pl-0 sm:pl-2' : 'pl-0 sm:pl-4'
            }`}
          >
            {/* Header Metadata Rule */}
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-1.5 text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#C4432B]">{turnNumber}</span>
                <span className="text-[#2B2A28] font-medium">
                  {isUser ? 'AUTHOR REFLECTION' : 'GEMINI EDITORIAL SYNTHESIS'}
                </span>
                {!isUser && (
                  <span className="font-script text-[#C4432B] text-sm normal-case tracking-normal ml-1">
                    editor note
                  </span>
                )}
                {msg.modelUsed && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 border border-[#E2DDD5] bg-[#EFECE6] text-[9px] text-[#595652]">
                    {msg.modelUsed}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onPinQuote && (
                  <button
                    onClick={() => onPinQuote(msg.content.slice(0, 300))}
                    className="hover:text-[#C4432B] transition-colors p-1"
                    title="Pin to Quote Card Studio"
                  >
                    <Quote className="w-3 h-3" />
                  </button>
                )}
                <span className="text-[9px]">{msg.timestamp}</span>
                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="hover:text-[#C4432B] transition-colors p-1"
                  title="Copy text"
                >
                  {copiedId === msg.id ? (
                    <CheckCheck className="w-3 h-3 text-[#C4432B]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Message Body */}
            {isUser ? (
              <div className="pl-4 border-l-2 border-[#C4432B] py-1">
                <p className="text-base sm:text-lg font-serif text-[#2B2A28] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ) : (
              <div className="bg-[#FFFDF9] border border-[#E2DDD5] p-5 sm:p-7 space-y-4 shadow-2xs rounded-xs">
                <div className="prose prose-stone max-w-none text-base font-serif text-[#2B2A28] leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Streaming / Generating Indicator */}
      {isGenerating && (
        <div className="border-b border-[#E2DDD5] pb-1.5 flex items-center justify-between text-[10px] font-sans uppercase tracking-[0.2em] text-[#C4432B] animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formulating Editorial Response...</span>
          </div>
        </div>
      )}
    </div>
  );
};

