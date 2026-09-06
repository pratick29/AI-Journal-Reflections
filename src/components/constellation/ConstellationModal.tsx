import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  X,
  Compass,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  BookOpen,
} from 'lucide-react';
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
  isDragging?: boolean;
}

interface BackgroundStar {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  reflection: '#C4432B', // Terracotta
  brainstorm: '#D97706', // Warm Amber
  mindfulness: '#10B981', // Sage Emerald
  gratitude: '#EC4899', // Rose Quartz
  goals: '#6366F1', // Indigo
};

// Deterministic pseudo-random number generator for stable star positioning
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const ConstellationModal: React.FC<ConstellationModalProps> = ({
  isOpen,
  onClose,
  interactions,
  onSelectInteraction,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // State for React drawer/inspection card & category filter
  const [selectedStar, setSelectedStar] = useState<Interaction | null>(null);
  const [hoveredStar, setHoveredStar] = useState<Interaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Refs for animation loop & mouse interaction to avoid re-triggering effects
  const starsRef = useRef<StarNode[]>([]);
  const bgStarsRef = useRef<BackgroundStar[]>([]);
  const hoveredStarRef = useRef<Interaction | null>(null);
  const selectedStarRef = useRef<Interaction | null>(null);
  const selectedCategoryRef = useRef<string>('all');

  // Camera Pan & Zoom Transform
  const viewRef = useRef<{ x: number; y: number; scale: number }>({
    x: 0,
    y: 0,
    scale: 1,
  });

  // Mouse interaction state
  const mouseStateRef = useRef<{
    isPanning: boolean;
    draggedStar: StarNode | null;
    startX: number;
    startY: number;
    lastMouseX: number;
    lastMouseY: number;
  }>({
    isPanning: false,
    draggedStar: null,
    startX: 0,
    startY: 0,
    lastMouseX: -1000,
    lastMouseY: -1000,
  });

  // Sync category filter ref
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  // Sync selected star ref
  useEffect(() => {
    selectedStarRef.current = selectedStar;
  }, [selectedStar]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize stars deterministically based on interactions
  useEffect(() => {
    if (!isOpen) return;

    const count = interactions.length;
    if (count === 0) {
      starsRef.current = [];
      return;
    }

    // Base world dimensions for layout
    const baseW = 1000;
    const baseH = 700;
    const centerX = baseW / 2;
    const centerY = baseH / 2;

    const newStars: StarNode[] = interactions.map((interaction, idx) => {
      const seed = stringToSeed(interaction.id || `star-${idx}`);
      let cx: number;
      let cy: number;

      if (count === 1) {
        cx = centerX;
        cy = centerY;
      } else {
        // Distribute in a celestial spiral/galaxy formation
        const goldenAngle = 2.39996; // ~137.5 degrees
        const angle = idx * goldenAngle + seededRandom(seed) * 0.4;
        const normalizedIdx = idx / Math.max(1, count - 1);
        const dist = 70 + Math.sqrt(normalizedIdx) * 280 + (seededRandom(seed + 1) - 0.5) * 40;
        cx = centerX + Math.cos(angle) * dist;
        cy = centerY + Math.sin(angle) * dist * 0.75; // slight elliptical inclination
      }

      const messageCount = interaction.messages?.length || 1;
      const wordCount = interaction.messages?.reduce((acc, m) => acc + (m.content?.length || 0), 0) || 0;
      const radius = Math.min(10, Math.max(4.5, 4 + Math.log2(1 + messageCount) * 1.8 + (wordCount > 500 ? 1.5 : 0)));

      return {
        id: interaction.id,
        x: cx,
        y: cy,
        vx: (seededRandom(seed + 2) - 0.5) * 0.08,
        vy: (seededRandom(seed + 3) - 0.5) * 0.08,
        radius,
        color: CATEGORY_COLORS[interaction.category] || '#C4432B',
        interaction,
        pulsePhase: seededRandom(seed + 4) * Math.PI * 2,
      };
    });

    starsRef.current = newStars;

    // Generate static twinkling background dust
    const bgDust: BackgroundStar[] = [];
    for (let i = 0; i < 75; i++) {
      bgDust.push({
        x: seededRandom(i * 13) * (baseW + 400) - 200,
        y: seededRandom(i * 17) * (baseH + 400) - 200,
        radius: 0.6 + seededRandom(i * 23) * 1.2,
        baseAlpha: 0.15 + seededRandom(i * 29) * 0.45,
        pulseSpeed: 0.01 + seededRandom(i * 31) * 0.03,
        pulsePhase: seededRandom(i * 37) * Math.PI * 2,
      });
    }
    bgStarsRef.current = bgDust;
  }, [isOpen, interactions]);

  // Main Canvas Render & Interaction Loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let cssWidth = container.clientWidth || 800;
    let cssHeight = container.clientHeight || 600;

    // Center view initially
    const resetCamera = () => {
      cssWidth = container.clientWidth || 800;
      cssHeight = container.clientHeight || 600;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      // Center the 1000x700 world coordinate system inside container
      const scale = Math.min(cssWidth / 1050, cssHeight / 750, 1.2);
      viewRef.current = {
        x: (cssWidth - 1000 * scale) / 2,
        y: (cssHeight - 700 * scale) / 2,
        scale: Math.max(0.6, scale),
      };
      setZoomLevel(Math.round(viewRef.current.scale * 100));
    };

    resetCamera();

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !canvas) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0 && (newW !== cssWidth || newH !== cssHeight)) {
        cssWidth = newW;
        cssHeight = newH;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(cssWidth * dpr);
        canvas.height = Math.floor(cssHeight * dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      }
    });
    resizeObserver.observe(container);

    // Coordinate conversion utilities
    const screenToWorld = (screenX: number, screenY: number) => {
      const { x, y, scale } = viewRef.current;
      return {
        x: (screenX - x) / scale,
        y: (screenY - y) / scale,
      };
    };

    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      };
    };

    // Find star at world coordinate
    const findStarAt = (worldX: number, worldY: number, toleranceExtra = 8): StarNode | null => {
      const activeCategory = selectedCategoryRef.current;
      const stars = starsRef.current;
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        if (activeCategory !== 'all' && s.interaction.category !== activeCategory) {
          continue;
        }
        const dx = s.x - worldX;
        const dy = s.y - worldY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= s.radius + toleranceExtra) {
          return s;
        }
      }
      return null;
    };

    // Mouse event handlers
    const handleMouseDown = (e: MouseEvent) => {
      const { screenX, screenY } = getMousePos(e);
      const world = screenToWorld(screenX, screenY);
      const star = findStarAt(world.x, world.y, 10 / viewRef.current.scale);

      if (star) {
        mouseStateRef.current.draggedStar = star;
        star.isDragging = true;
      } else {
        mouseStateRef.current.isPanning = true;
        mouseStateRef.current.startX = screenX - viewRef.current.x;
        mouseStateRef.current.startY = screenY - viewRef.current.y;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { screenX, screenY } = getMousePos(e);
      mouseStateRef.current.lastMouseX = screenX;
      mouseStateRef.current.lastMouseY = screenY;

      const m = mouseStateRef.current;

      if (m.draggedStar) {
        const world = screenToWorld(screenX, screenY);
        m.draggedStar.x = world.x;
        m.draggedStar.y = world.y;
        canvas.style.cursor = 'grabbing';
        return;
      }

      if (m.isPanning) {
        viewRef.current.x = screenX - m.startX;
        viewRef.current.y = screenY - m.startY;
        canvas.style.cursor = 'grabbing';
        return;
      }

      // Hover check
      const world = screenToWorld(screenX, screenY);
      const star = findStarAt(world.x, world.y, 8 / viewRef.current.scale);

      if (star) {
        canvas.style.cursor = 'pointer';
        if (hoveredStarRef.current?.id !== star.interaction.id) {
          hoveredStarRef.current = star.interaction;
          setHoveredStar(star.interaction);
        }
      } else {
        canvas.style.cursor = 'crosshair';
        if (hoveredStarRef.current !== null) {
          hoveredStarRef.current = null;
          setHoveredStar(null);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const m = mouseStateRef.current;
      const { screenX, screenY } = getMousePos(e);
      const world = screenToWorld(screenX, screenY);

      // If we were dragging a star, release it
      if (m.draggedStar) {
        m.draggedStar.isDragging = false;
        m.draggedStar = null;
        canvas.style.cursor = 'pointer';
        return;
      }

      // If it was a clean click (not a long drag), select the star
      if (!m.isPanning || (Math.abs(screenX - (m.startX + viewRef.current.x)) < 4 && Math.abs(screenY - (m.startY + viewRef.current.y)) < 4)) {
        const star = findStarAt(world.x, world.y, 10 / viewRef.current.scale);
        if (star) {
          selectedStarRef.current = star.interaction;
          setSelectedStar(star.interaction);
        }
      }

      m.isPanning = false;
      canvas.style.cursor = hoveredStarRef.current ? 'pointer' : 'crosshair';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { screenX, screenY } = getMousePos(e);
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;

      const currentScale = viewRef.current.scale;
      const newScale = Math.min(3.5, Math.max(0.35, currentScale * zoomFactor));

      // Zoom towards mouse position
      const worldX = (screenX - viewRef.current.x) / currentScale;
      const worldY = (screenY - viewRef.current.y) / currentScale;

      viewRef.current.scale = newScale;
      viewRef.current.x = screenX - worldX * newScale;
      viewRef.current.y = screenY - worldY * newScale;

      setZoomLevel(Math.round(newScale * 100));
    };

    const handleMouseLeave = () => {
      mouseStateRef.current.isPanning = false;
      if (mouseStateRef.current.draggedStar) {
        mouseStateRef.current.draggedStar.isDragging = false;
        mouseStateRef.current.draggedStar = null;
      }
      hoveredStarRef.current = null;
      setHoveredStar(null);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Render loop
    let globalTime = 0;

    const render = () => {
      globalTime += 0.015;
      const dpr = window.devicePixelRatio || 1;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep obsidian void background
      ctx.fillStyle = '#141312';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply DPR and Camera Pan/Zoom transform
      ctx.scale(dpr, dpr);
      const { x: panX, y: panY, scale } = viewRef.current;
      ctx.translate(panX, panY);
      ctx.scale(scale, scale);

      // 1. Draw subtle celestial coordinate rings & grid in world space
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1 / scale;

      // Radial rings centered around galaxy center (500, 350)
      const gx = 500;
      const gy = 350;
      for (let r = 120; r <= 600; r += 120) {
        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Subtle celestial crosshairs
      ctx.beginPath();
      ctx.moveTo(gx - 600, gy);
      ctx.lineTo(gx + 600, gy);
      ctx.moveTo(gx, gy - 450);
      ctx.lineTo(gx, gy + 450);
      ctx.stroke();

      // 2. Draw static background twinkling stars (dust)
      for (const bg of bgStarsRef.current) {
        const pulse = Math.sin(globalTime * 1.5 + bg.pulsePhase);
        const alpha = Math.max(0.05, Math.min(0.8, bg.baseAlpha + pulse * 0.15));
        ctx.fillStyle = `rgba(247, 244, 238, ${alpha})`;
        ctx.beginPath();
        ctx.arc(bg.x, bg.y, bg.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const stars = starsRef.current;
      const activeCategory = selectedCategoryRef.current;
      const hoveredId = hoveredStarRef.current?.id;
      const selectedId = selectedStarRef.current?.id;

      // 3. Update star micro-drift (only if not being dragged)
      for (const s of stars) {
        if (!s.isDragging) {
          s.x += s.vx;
          s.y += s.vy;
          s.pulsePhase += 0.025;

          // Gentle soft bounce within bounding arena
          if (s.x < 50 || s.x > 950) s.vx *= -1;
          if (s.y < 50 || s.y > 650) s.vy *= -1;
        }
      }

      // 4. Draw constellation connecting filaments
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const s1 = stars[i];
          const s2 = stars[j];

          const isMatchCategory = s1.interaction.category === s2.interaction.category;
          const isFilterActive = activeCategory !== 'all';
          const bothInActiveCategory = !isFilterActive || (s1.interaction.category === activeCategory && s2.interaction.category === activeCategory);

          if (isFilterActive && !bothInActiveCategory) {
            continue;
          }

          const dx = s2.x - s1.x;
          const dy = s2.y - s1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = isMatchCategory ? 190 : 110;

          if (dist < maxDist) {
            const isHighlight = s1.id === hoveredId || s2.id === hoveredId || s1.id === selectedId || s2.id === selectedId;
            const baseAlpha = (1 - dist / maxDist) * (isMatchCategory ? 0.32 : 0.1);
            const alpha = isHighlight ? Math.min(0.8, baseAlpha * 2.2) : baseAlpha;

            ctx.strokeStyle = isMatchCategory ? s1.color : 'rgba(230, 224, 215, 0.3)';
            ctx.globalAlpha = alpha;
            ctx.lineWidth = (isHighlight ? 2 : isMatchCategory ? 1.3 : 0.8) / scale;

            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      // 5. Draw stars and halos
      for (const s of stars) {
        const isHovered = s.id === hoveredId;
        const isSelected = s.id === selectedId;
        const isFilterMatch = activeCategory === 'all' || s.interaction.category === activeCategory;

        const pulse = Math.sin(s.pulsePhase) * 1.5;
        const currentRadius = s.radius + (isHovered || isSelected ? pulse + 2 : pulse * 0.5);

        // Opacity based on category filter
        const starOpacity = isFilterMatch ? 1 : 0.2;
        ctx.globalAlpha = starOpacity;

        // Radiant Glowing Outer Halo
        const haloMultiplier = isSelected ? 4.5 : isHovered ? 3.8 : 2.5;
        const haloRadius = currentRadius * haloMultiplier;
        const gradient = ctx.createRadialGradient(s.x, s.y, currentRadius * 0.4, s.x, s.y, haloRadius);
        gradient.addColorStop(0, s.color);
        gradient.addColorStop(0.5, `${s.color}66`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(s.x, s.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Selected / Hovered focus ring
        if (isSelected || isHovered) {
          ctx.strokeStyle = isSelected ? '#FFFDF9' : s.color;
          ctx.lineWidth = (isSelected ? 2 : 1.5) / scale;
          ctx.beginPath();
          ctx.arc(s.x, s.y, currentRadius + 5 / scale, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Solid Core Star
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#FFFDF9';
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(1.5, currentRadius), 0, Math.PI * 2);
        ctx.fill();

        // Star center tint
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(1, currentRadius * 0.45), 0, Math.PI * 2);
        ctx.fill();

        // Draw crisp label on canvas if hovered or selected
        if (isHovered || isSelected) {
          const fontSize = Math.max(10, Math.min(14, 12 / Math.sqrt(scale)));
          ctx.font = `500 ${fontSize}px "Newsreader", Georgia, serif`;
          
          const title = s.interaction.title || 'Untitled Inquiry';
          const textMetrics = ctx.measureText(title);
          const badgeX = s.x + currentRadius + 10 / scale;
          const badgeY = s.y;

          // Pill background for readability
          ctx.fillStyle = 'rgba(22, 21, 20, 0.88)';
          ctx.strokeStyle = isSelected ? s.color : 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1 / scale;

          const paddingH = 6 / scale;
          const paddingV = 4 / scale;
          const rectW = textMetrics.width + paddingH * 2;
          const rectH = fontSize + paddingV * 2;
          const rectY = badgeY - rectH / 2;

          ctx.beginPath();
          ctx.roundRect(badgeX, rectY, rectW, rectH, 3 / scale);
          ctx.fill();
          ctx.stroke();

          // Title text
          ctx.fillStyle = '#FFFDF9';
          ctx.fillText(title, badgeX + paddingH, badgeY + fontSize * 0.35);
        }

        ctx.globalAlpha = 1;
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isOpen]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    viewRef.current.scale = Math.min(3.5, viewRef.current.scale * 1.25);
    setZoomLevel(Math.round(viewRef.current.scale * 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    viewRef.current.scale = Math.max(0.35, viewRef.current.scale * 0.8);
    setZoomLevel(Math.round(viewRef.current.scale * 100));
  }, []);

  const handleResetView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cssWidth = container.clientWidth || 800;
    const cssHeight = container.clientHeight || 600;
    const scale = Math.min(cssWidth / 1050, cssHeight / 750, 1.2);
    viewRef.current = {
      x: (cssWidth - 1000 * scale) / 2,
      y: (cssHeight - 700 * scale) / 2,
      scale: Math.max(0.6, scale),
    };
    setZoomLevel(Math.round(viewRef.current.scale * 100));
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: interactions.length };
    for (const item of interactions) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [interactions]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0D0D0C]/85 backdrop-blur-md font-serif animate-in fade-in duration-150"
    >
      <div className="bg-[#161514] border border-[#2E2C29] shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col rounded-xs overflow-hidden relative">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#2E2C29] flex flex-wrap items-center justify-between bg-[#1A1917] z-10 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#242220] border border-[#3D3A36] flex items-center justify-center text-amber-500">
              <Compass className="w-4 h-4 text-[#C4432B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-light text-[#F7F4EE] tracking-wide">
                  The Idea Constellation
                </h2>
                <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-xs bg-[#242220] text-[#A6A095] border border-[#33312D]">
                  {interactions.length} {interactions.length === 1 ? 'Node' : 'Nodes'}
                </span>
              </div>
              <p className="text-[10px] font-sans text-[#8A8478] uppercase tracking-wider">
                Navigate the cosmos of your thoughts &bull; Drag to pan &bull; Scroll to zoom
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Category Filter Pills */}
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-sans">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2 py-1 rounded-xs uppercase tracking-wider transition-all border ${
                  selectedCategory === 'all'
                    ? 'bg-[#F7F4EE] text-[#161514] border-[#F7F4EE] font-medium'
                    : 'bg-[#242220] text-[#8A8478] border-[#33312D] hover:text-[#C7C2BA]'
                }`}
              >
                All ({categoryCounts.all || 0})
              </button>

              {Object.entries(CATEGORY_COLORS).map(([cat, col]) => {
                const count = categoryCounts[cat] || 0;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-xs uppercase tracking-wider transition-all border ${
                      isSelected
                        ? 'bg-[#2E2C29] text-[#FFFDF9] border-[#555049]'
                        : 'bg-[#1C1B19] text-[#8A8478] border-[#2E2C29] hover:text-[#C7C2BA]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full transition-transform"
                      style={{
                        backgroundColor: col,
                        transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                      }}
                    />
                    <span>{cat}</span>
                    <span className="text-[9px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 hover:bg-[#2E2C29] text-[#8A8478] hover:text-[#F7F4EE] rounded-xs transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area Container */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#141312]">
          <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair select-none" />

          {/* Empty State Overlay */}
          {interactions.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[#141312]/90 pointer-events-auto">
              <div className="w-16 h-16 rounded-full bg-[#1F1E1B] border border-[#33312D] flex items-center justify-center mb-4 text-[#C4432B]">
                <Sparkles className="w-8 h-8 stroke-1 animate-pulse" />
              </div>
              <h3 className="font-serif text-xl text-[#F7F4EE] font-light mb-2">
                Your Cosmos Awaits
              </h3>
              <p className="text-xs text-[#8A8478] max-w-sm leading-relaxed mb-5 font-serif">
                No reflections charted yet. Begin penning your thoughts in the journal editor to form your interconnected galaxy of ideas.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#C4432B] hover:bg-[#8B3A2B] text-[#FFFDF9] text-xs uppercase tracking-wider font-sans font-semibold rounded-xs transition-colors flex items-center gap-2 shadow-lg"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Begin Journaling</span>
              </button>
            </div>
          )}

          {/* Floating Zoom & Camera Toolbar */}
          <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 bg-[#1C1B19]/90 border border-[#33312D] p-1 rounded-xs backdrop-blur-sm shadow-xl">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 text-[#8A8478] hover:text-[#F7F4EE] hover:bg-[#2A2926] rounded-xs transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[10px] font-mono text-[#8A8478] select-none min-w-[40px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 text-[#8A8478] hover:text-[#F7F4EE] hover:bg-[#2A2926] rounded-xs transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-[#33312D] mx-0.5" />
            <button
              onClick={handleResetView}
              title="Reset Galaxy Center"
              className="p-1.5 text-[#8A8478] hover:text-[#F7F4EE] hover:bg-[#2A2926] rounded-xs transition-colors flex items-center gap-1 text-[10px] font-sans"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[#8A8478] uppercase tracking-wider text-[9px]">Reset</span>
            </button>
          </div>

          {/* Selected Star Inspection Card Drawer */}
          {selectedStar && (
            <div className="absolute bottom-5 right-5 z-20 w-84 max-w-[calc(100%-2.5rem)] bg-[#1A1917]/95 border border-[#3D3A36] p-4 rounded-xs shadow-2xl backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-150">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className="text-[9px] font-sans uppercase tracking-widest px-2 py-0.5 rounded-xs inline-block"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[selectedStar.category] || '#C4432B'}20`,
                      color: CATEGORY_COLORS[selectedStar.category] || '#C4432B',
                      border: `1px solid ${CATEGORY_COLORS[selectedStar.category] || '#C4432B'}40`,
                    }}
                  >
                    {selectedStar.category}
                  </span>
                  <h3 className="font-serif text-sm font-medium text-[#F7F4EE] mt-1.5 line-clamp-1 leading-snug">
                    {selectedStar.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedStar(null)}
                  className="text-[#8A8478] hover:text-[#F7F4EE] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-[#C7C2BA] font-serif line-clamp-3 leading-relaxed">
                {selectedStar.summary ||
                  selectedStar.messages[0]?.content.slice(0, 160) ||
                  'Personal reflection inquiry.'}
              </p>

              <div className="pt-2 border-t border-[#33312D] flex items-center justify-between text-[10px] font-sans">
                <span className="text-[#8A8478]">
                  {new Date(selectedStar.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <button
                  onClick={() => {
                    onSelectInteraction(selectedStar);
                    onClose();
                  }}
                  className="px-3 py-1 bg-[#C4432B] hover:bg-[#8B3A2B] text-[#F7F4EE] uppercase tracking-wider font-semibold rounded-xs flex items-center gap-1.5 transition-colors shadow-sm"
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
