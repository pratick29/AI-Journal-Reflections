import React, { useEffect, useRef } from 'react';

interface AmbientCanvasProps {
  enabled?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  color: string;
  pulseSpeed: number;
  pulseAngle: number;
}

export const AmbientCanvas: React.FC<AmbientCanvasProps> = ({ enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Color palette: terracotta rust, warm gold/amber, and charcoal dust motes
    const colors = [
      'rgba(196, 67, 43, ',   // terracotta rust
      'rgba(217, 149, 74, ',  // warm gold ember
      'rgba(138, 132, 120, ', // warm paper taupe
      'rgba(43, 42, 40, ',    // faint charcoal mote
    ];

    const particleCount = Math.min(45, Math.floor((width * height) / 28000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const maxAlpha = 0.15 + Math.random() * 0.35;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.15 - Math.random() * 0.3, // slow upward float like embers
        radius: 1 + Math.random() * 2.2,
        alpha: Math.random() * maxAlpha,
        maxAlpha,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: 0.01 + Math.random() * 0.02,
        pulseAngle: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Natural Brownian drift + gentle upward float
        p.x += p.vx + Math.sin(p.pulseAngle) * 0.15;
        p.y += p.vy;

        // Pulse alpha gently
        p.pulseAngle += p.pulseSpeed;
        p.alpha = Math.abs(Math.sin(p.pulseAngle)) * p.maxAlpha;

        // Interactive cursor repulsion / subtle glow reaction
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 130;

          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 1.5;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
            p.alpha = Math.min(0.65, p.alpha + (1 - dist / maxDist) * 0.4);
          }
        }

        // Screen wrap
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
