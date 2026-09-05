import React, { useRef, useEffect, useState } from 'react';
import { X, Sparkles, Compass, Eye, ArrowRight } from 'lucide-react';
import { Interaction } from '../../types';

interface ConstellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
  onSelectInteraction: (interaction: Interaction) => void;
}

interface StarNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  interaction: Interaction;
  pulsePhase: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  reflection: '#C4432B', // Terracotta
  brainstorm: '#D97706', // Warm Amber
  mindfulness: '#10B981', // Sage Emerald
  gratitude: '#EC4899', // Rose Quartz
  goals: '#6366F1', // Indigo
};

export const ConstellationModal: React.FC<ConstellationModalProps> = ({
  isOpen,
  onClose,
  interactions,
  onSelectInteraction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedStar, setSelectedStar] = useState<Interaction | null>(null);
  const [hoveredStar, setHoveredStar] = useState<Interaction | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Build star nodes
    const stars: StarNode[] = interactions.map((interaction, idx) => {
      const angle = (idx / Math.max(1, interactions.length)) * Math.PI * 2;
      const dist = 80 + Math.random() * (Math.min(width, height) * 0.35);
      const cx = width / 2 + Math.cos(angle) * dist;
      const cy = height / 2 + Math.sin(angle) * dist;

      return {
        id: interaction.id,
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: 3.5 + Math.min(interaction.messages.length * 0.8, 5),
        color: CATEGORY_COLORS[interaction.category] || '#C4432B',
        interaction,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });

    let mouseX = -1000;
    let mouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      let found: Interaction | null = null;
      for (const s of stars) {
        const dx = s.x - mouseX;
        const dy = s.y - mouseY;
        if (Math.sqrt(dx * dx + dy * dy) < s.radius + 8) {
          found = s.interaction;
          break;
        }
      }
      setHoveredStar(found);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      for (const s of stars) {
        const dx = s.x - cx;
        const dy = s.y - cy;
        if (Math.sqrt(dx * dx + dy * dy) < s.radius + 10) {
          setSelectedStar(s.interaction);
          return;
        }
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.fillStyle = '#161514'; // Deep obsidian canvas
      ctx.fillRect(0, 0, width, height);

      // Draw faint background celestial grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update positions and gentle drift
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        s.pulsePhase += 0.03;

        // Keep inside bounds
        if (s.x < 40 || s.x > width - 40) s.vx *= -1;
        if (s.y < 40 || s.y > height - 40) s.vy *= -1;
      }

      // Draw constellation connecting filaments
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const s1 = stars[i];
          const s2 = stars[j];
          const dx = s2.x - s1.x;
          const dy = s2.y - s1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connect if close or share category
          const shareCategory = s1.interaction.category === s2.interaction.category;
          const maxDist = shareCategory ? 160 : 90;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (shareCategory ? 0.25 : 0.08);
            ctx.strokeStyle = shareCategory ? s1.color : 'rgba(226, 221, 213, 0.15)';
            ctx.globalAlpha = alpha;
            ctx.lineWidth = shareCategory ? 1.2 : 0.8;
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      // Draw stars
      for (const s of stars) {
        const pulse = Math.sin(s.pulsePhase) * 1.5;
        const currentRadius = s.radius + pulse;

        // Glowing outer halo
        const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, currentRadius * 3);
        gradient.addColorStop(0, s.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(s.x, s.y, currentRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core star
        ctx.fillStyle = '#FFFDF9';
        ctx.beginPath();
        ctx.arc(s.x, s.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Label for hovered or selected star
        if (hoveredStar?.id === s.id || selectedStar?.id === s.id) {
          ctx.font = '11px "Newsreader", serif';
          ctx.fillStyle = '#F7F4EE';
          ctx.fillText(s.interaction.title, s.x + currentRadius + 6, s.y + 4);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('click', onClick);
      }
    };
  }, [isOpen, interactions, hoveredStar, selectedStar]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0C]/80 backdrop-blur-md font-serif">
      <div className="bg-[#161514] border border-[#2E2C29] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col rounded-xs overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-[#2E2C29] flex items-center justify-between bg-[#1C1B19] z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌌</span>
            <div>
              <h2 className="text-base font-serif font-light text-[#F7F4EE]">
                The Idea Constellation
              </h2>
              <p className="text-[10px] font-sans text-[#8A8478] uppercase tracking-wider">
                Topological map of your reflections across time ({interactions.length} Inquiries)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[10px] font-sans">
              {Object.entries(CATEGORY_COLORS).map(([cat, col]) => (
                <span key={cat} className="flex items-center gap-1 text-[#C7C2BA] uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
                  <span>{cat}</span>
                </span>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1 hover:bg-[#2E2C29] text-[#8A8478] hover:text-[#F7F4EE] rounded-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

          {/* Inspection Card Drawer */}
          {selectedStar && (
            <div className="absolute bottom-6 right-6 z-20 w-80 bg-[#1F1E1B]/95 border border-[#3D3A36] p-4 rounded-xs shadow-2xl backdrop-blur-md space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="text-[9px] font-sans uppercase tracking-widest px-2 py-0.5 rounded-xs"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[selectedStar.category]}20`,
                      color: CATEGORY_COLORS[selectedStar.category],
                      border: `1px solid ${CATEGORY_COLORS[selectedStar.category]}40`,
                    }}
                  >
                    {selectedStar.category}
                  </span>
                  <h3 className="font-serif text-sm font-medium text-[#F7F4EE] mt-1.5 line-clamp-1">
                    {selectedStar.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedStar(null)}
                  className="text-[#8A8478] hover:text-[#F7F4EE]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-[#C7C2BA] font-serif line-clamp-3 leading-relaxed">
                {selectedStar.summary || selectedStar.messages[0]?.content.slice(0, 160) || 'Personal reflection inquiry.'}
              </p>

              <div className="pt-2 border-t border-[#33312D] flex items-center justify-between text-[10px] font-sans">
                <span className="text-[#8A8478]">
                  {new Date(selectedStar.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    onSelectInteraction(selectedStar);
                    onClose();
                  }}
                  className="px-3 py-1 bg-[#C4432B] hover:bg-[#8B3A2B] text-[#F7F4EE] uppercase tracking-wider font-semibold rounded-xs flex items-center gap-1 transition-colors"
                >
                  <span>Open Inquiry</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
