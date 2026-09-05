import React, { useState } from 'react';
import { X, Printer, Download, BookOpen, Check } from 'lucide-react';
import { Interaction } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AnthologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
}

export const AnthologyModal: React.FC<AnthologyModalProps> = ({
  isOpen,
  onClose,
  interactions,
}) => {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>(interactions.map((i) => i.id));
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const authorName = user?.email?.split('@')[0] || 'The Author';
  const currentYear = new Date().getFullYear();
  const selectedInteractions = interactions.filter((i) => selectedIds.includes(i.id));

  const toRoman = (num: number) => {
    const romanMap: [number, string][] = [
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let result = '';
    for (const [val, sym] of romanMap) {
      while (num >= val) {
        result += sym;
        num -= val;
      }
    }
    return result || 'I';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    let md = `# PERSONAL REFLECTIONS & SOCRATIC INQUIRIES\n`;
    md += `## A Literary Anthology of Mind & Spirit\n`;
    md += `**Author:** ${authorName}\n**Compiled:** ${new Date().toLocaleDateString()}\n\n---\n\n`;
    md += `## TABLE OF CONTENTS\n\n`;

    selectedInteractions.forEach((item, idx) => {
      md += `${idx + 1}. **${item.title}** (${new Date(item.createdAt).toLocaleDateString()}) — *${item.category.toUpperCase()}*\n`;
    });

    md += `\n\n---\n\n`;

    selectedInteractions.forEach((item, idx) => {
      md += `\n\n# CHAPTER ${toRoman(idx + 1)}: ${item.title.toUpperCase()}\n`;
      md += `*Inscribed on ${new Date(item.createdAt).toLocaleDateString()} | Category: ${item.category}*\n\n`;

      item.messages.forEach((msg) => {
        md += `### ${msg.role === 'user' ? 'AUTHOR' : 'SOCRATIC INQUIRY'}\n\n${msg.content}\n\n`;
      });
      md += `\n❦\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Anthology_${authorName}_${currentYear}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-[#1A1918]/70 backdrop-blur-xs font-serif">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col rounded-xs overflow-hidden print:p-0 print:border-none print:shadow-none print:max-w-none print:h-auto">
        {/* Header toolbar (hidden when printing) */}
        <div className="px-6 py-3.5 border-b border-[#E2DDD5] flex items-center justify-between bg-[#F7F4EE] print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C4432B]" />
            <div>
              <h2 className="text-base font-serif font-medium text-[#2B2A28]">
                Book-Bound Anthology Generator
              </h2>
              <p className="text-[10px] font-sans text-[#8A8478] uppercase tracking-wider">
                Typeset Memoir Edition ({selectedInteractions.length} Inquiries Selected)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 border border-[#E2DDD5] bg-[#FFFFFF] hover:border-[#2B2A28] text-[#595652] text-[10px] font-sans uppercase tracking-wider font-semibold rounded-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copied ? 'Downloaded' : 'Markdown'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-[10px] font-sans uppercase tracking-wider font-semibold rounded-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 hover:bg-[#EFECE6] text-[#8A8478] hover:text-[#2B2A28] rounded-xs ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Typeset Manuscript View */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-[#FBF9F5] print:p-8 print:bg-white text-[#2B2A28]">
          <div className="max-w-2xl mx-auto space-y-16">
            {/* Frontispiece / Cover Page */}
            <div className="border-4 border-double border-[#2B2A28]/40 p-8 sm:p-12 text-center space-y-6 my-8 rounded-xs bg-[#FFFDF9] shadow-xs">
              <div className="text-xs font-sans tracking-[0.3em] uppercase text-[#8A8478]">
                Private Monograph Edition
              </div>

              <div className="w-12 h-0.5 bg-[#C4432B] mx-auto" />

              <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-wide text-[#2B2A28]">
                REFLECTIONS & SOCRATIC INQUIRIES
              </h1>

              <p className="text-sm font-serif italic text-[#595652]">
                A Personal Philosophical Anthology
              </p>

              <div className="pt-8 text-xs font-sans uppercase tracking-[0.25em] text-[#2B2A28] font-semibold">
                By {authorName}
              </div>

              <div className="text-[10px] font-mono text-[#8A8478]">
                {currentYear} • Volume I
              </div>
            </div>

            {/* Table of Contents */}
            <div className="border-t border-b border-[#E2DDD5] py-8 space-y-4">
              <h3 className="text-center font-sans text-xs uppercase tracking-[0.25em] font-bold text-[#8A8478]">
                Table of Contents
              </h3>
              <div className="divide-y divide-[#E2DDD5]/60">
                {selectedInteractions.map((item, idx) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-baseline justify-between text-xs font-serif"
                  >
                    <span className="flex items-center gap-2 text-[#2B2A28]">
                      <span className="font-mono text-[10px] text-[#8A8478] w-6">
                        {toRoman(idx + 1)}.
                      </span>
                      <span className="font-medium hover:text-[#C4432B] transition-colors">
                        {item.title}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-[#8A8478]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapters */}
            <div className="space-y-16">
              {selectedInteractions.map((item, idx) => {
                const firstUserMsg = item.messages.find((m) => m.role === 'user');
                const firstLetter = firstUserMsg?.content.charAt(0) || 'I';
                const restOfFirstMsg = firstUserMsg?.content.slice(1) || '';

                return (
                  <article key={item.id} className="space-y-6 pt-8 border-t border-[#E2DDD5]/80">
                    {/* Chapter Header */}
                    <div className="text-center space-y-1">
                      <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C4432B] font-bold block">
                        Chapter {toRoman(idx + 1)}
                      </span>
                      <h2 className="text-2xl font-serif font-light text-[#2B2A28]">
                        {item.title}
                      </h2>
                      <div className="text-[10px] font-mono text-[#8A8478]">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    {/* Dialogue Transcript */}
                    <div className="space-y-6 text-sm font-serif leading-relaxed">
                      {item.messages.map((msg, mIdx) => (
                        <div key={msg.id || mIdx} className="space-y-1.5">
                          <div className="text-[10px] font-sans uppercase tracking-[0.18em] text-[#8A8478] font-bold">
                            {msg.role === 'user' ? authorName : 'The Socratic Guide'}
                          </div>

                          {mIdx === 0 && msg.role === 'user' ? (
                            <p className="text-base font-serif text-[#2B2A28] leading-relaxed">
                              <span className="float-left text-4xl leading-none font-serif text-[#C4432B] mr-2 font-bold select-none">
                                {firstLetter}
                              </span>
                              {restOfFirstMsg}
                            </p>
                          ) : (
                            <div className="text-[#3D3A36] whitespace-pre-wrap pl-3 border-l-2 border-l-[#E2DDD5]">
                              {msg.content}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Ornamental Divider */}
                    <div className="text-center text-[#C4432B] text-lg font-serif select-none pt-4">
                      ❦
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
