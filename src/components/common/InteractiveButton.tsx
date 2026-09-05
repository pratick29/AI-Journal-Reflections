import React, { useState } from 'react';

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  className = '',
  onClick,
  variant = 'primary',
  ...props
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 650);

    if (onClick) {
      onClick(e);
    }
  };

  const variantStyles = {
    primary: 'bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B]',
    secondary: 'bg-[#FFFDF9] text-[#2B2A28] border border-[#E2DDD5] hover:border-[#C4432B]',
    accent: 'bg-[#C4432B] text-[#F7F4EE] hover:bg-[#A8351F]',
    ghost: 'bg-transparent text-[#595652] hover:text-[#2B2A28] hover:bg-[#EFECE6]/60',
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`relative overflow-hidden interactive-lift text-xs font-sans uppercase tracking-[0.18em] transition-all rounded-full select-none disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${className}`}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ink-ripple-effect"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '35px',
            height: '35px',
            marginLeft: '-17.5px',
            marginTop: '-17.5px',
          }}
        />
      ))}
      <span className="relative z-10 flex items-center justify-center gap-1.5">{children}</span>
    </button>
  );
};
