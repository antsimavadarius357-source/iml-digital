import { useRef, useEffect, useState } from 'react';
import imlLogo3D from '../../assets/iml-3d-logo.jpg';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  fadeSpeed: number;
}

export default function Iml3DShowcaseAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  // Smooth 3D tilt tracking via requestAnimationFrame
  const tiltRef = useRef({
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
  });

  const spotlightRef = useRef({
    currentX: 50,
    currentY: 50,
    targetX: 50,
    targetY: 50,
  });

  // Handle Mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1

    setMousePos({ x, y });
    setIsHovered(true);

    // Target tilt angles (in degrees)
    tiltRef.current.targetX = (y - 0.5) * -12; // tilt vertically
    tiltRef.current.targetY = (x - 0.5) * 16;  // tilt horizontally

    // Target spotlight position (%)
    spotlightRef.current.targetX = x * 100;
    spotlightRef.current.targetY = y * 100;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    tiltRef.current.targetX = 0;
    tiltRef.current.targetY = 0;
    spotlightRef.current.targetX = 50;
    spotlightRef.current.targetY = 50;
  };

  // Particles & 3D Tilt animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize glowing particles
    const particleColors = [
      '#10b981', // Emerald green (I letter)
      '#34d399', // Mint green
      '#f59e0b', // Amber (M letter)
      '#fbbf24', // Gold (L letter)
      '#f97316', // Coral neon
      '#38bdf8', // Lotus Cyan
      '#60a5fa', // Lotus Blue
    ];

    const particles: Particle[] = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.3 - Math.random() * 0.6, // floating gently upwards
      radius: 1 + Math.random() * 2.5,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      alpha: Math.random() * 0.6,
      maxAlpha: 0.3 + Math.random() * 0.6,
      fadeSpeed: 0.005 + Math.random() * 0.01,
    }));

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      // 1. Smooth Tilt Lerp (Damping)
      const lerpFactor = 0.06;
      tiltRef.current.currentX += (tiltRef.current.targetX - tiltRef.current.currentX) * lerpFactor;
      tiltRef.current.currentY += (tiltRef.current.targetY - tiltRef.current.currentY) * lerpFactor;

      spotlightRef.current.currentX += (spotlightRef.current.targetX - spotlightRef.current.currentX) * lerpFactor;
      spotlightRef.current.currentY += (spotlightRef.current.targetY - spotlightRef.current.currentY) * lerpFactor;

      // Idle sine floating when not aggressively moving
      const idleFloatY = Math.sin(elapsed * 1.2) * 4;
      const idleTiltX = Math.cos(elapsed * 0.8) * 1.5;

      const finalTiltX = tiltRef.current.currentX + idleTiltX;
      const finalTiltY = tiltRef.current.currentY;

      // Update 3D transform on container
      const imgLayer = document.getElementById('iml-3d-animated-layer');
      if (imgLayer) {
        imgLayer.style.transform = `perspective(1200px) rotateX(${finalTiltX}deg) rotateY(${finalTiltY}deg) translateY(${idleFloatY}px) scale(1.02)`;
      }

      // Update cursor spotlight glow
      const spotlightEl = document.getElementById('iml-spotlight-layer');
      if (spotlightEl) {
        spotlightEl.style.background = `radial-gradient(circle 420px at ${spotlightRef.current.currentX}% ${spotlightRef.current.currentY}%, rgba(255, 255, 255, 0.12), rgba(16, 185, 129, 0.05) 30%, transparent 70%)`;
      }

      // 2. Render Particle Canvas
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Subtle repulsion from mouse position
        const pMouseDistX = p.x - mousePos.x * width;
        const pMouseDistY = p.y - mousePos.y * height;
        const dist = Math.sqrt(pMouseDistX * pMouseDistX + pMouseDistY * pMouseDistY);
        if (dist < 120) {
          p.x += (pMouseDistX / dist) * 0.8;
          p.y += (pMouseDistY / dist) * 0.8;
        }

        // Pulse alpha
        p.alpha += p.fadeSpeed;
        if (p.alpha > p.maxAlpha || p.alpha < 0.1) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        // Reset if off top or sides
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Draw glowing particle
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mousePos]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full bg-[#070d14] overflow-hidden select-none flex items-center justify-center cursor-crosshair"
      style={{ perspective: '1200px' }}
    >
      {/* 1. Ambient Background Dark Gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#050b12] via-[#09131f] to-[#0a1624] pointer-events-none" />

      {/* 2. Soft Neon Aura Glows behind Letters (Emerald behind I, Amber behind ML, Cyan behind Lotus) */}
      <div className="absolute top-[28%] left-[28%] w-[260px] h-[260px] bg-cyan-500/15 rounded-full blur-[90px] animate-pulse pointer-events-none" />
      <div className="absolute top-[48%] left-[32%] w-[220px] h-[280px] bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-[48%] left-[58%] w-[380px] h-[280px] bg-amber-500/20 rounded-full blur-[95px] pointer-events-none" />

      {/* 3. Main 3D IML Image Layer with smooth JS Tilt */}
      <div
        id="iml-3d-animated-layer"
        className="relative w-full h-full flex items-center justify-center transition-transform ease-out will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transitionDuration: '0.1s',
        }}
      >
        {/* Exact IML 3D Image */}
        <img
          src={imlLogo3D}
          alt="IML Digit Logo 3D Vitrine"
          className="w-full h-full object-cover object-center pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          loading="eager"
        />

        {/* 4. Animated Light Reflection Sweep across the Glass Facets */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden opacity-60 mix-blend-color-dodge"
          style={{
            maskImage: 'radial-gradient(ellipse 65% 55% at 55% 48%, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 55% 48%, black 40%, transparent 80%)',
          }}
        >
          <div 
            className="w-[200%] h-full bg-gradient-to-r from-transparent via-white/35 to-transparent transform -skew-x-25 animate-shimmer"
            style={{
              animation: 'shimmerSweep 6s infinite ease-in-out',
            }}
          />
        </div>

        {/* 5. Lotus Flower Pulsing Glow Point */}
        <div 
          className="absolute top-[18%] left-[32%] size-16 rounded-full bg-blue-400/25 blur-xl pointer-events-none animate-ping" 
          style={{ animationDuration: '4s' }}
        />

        {/* 6. Emerald "I" Sparkle Glint */}
        <div 
          className="absolute top-[44%] left-[30.5%] size-4 rounded-full bg-emerald-300 blur-sm pointer-events-none"
          style={{
            animation: 'glintBlink 3.2s infinite ease-in-out',
          }}
        />
      </div>

      {/* 7. Interactive Mouse Spotlight Overlay */}
      <div
        id="iml-spotlight-layer"
        className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-300"
        style={{ opacity: isHovered ? 0.9 : 0.4 }}
      />

      {/* 8. Particle Canvas (Floating Luminous Embers & Neon Dust) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-20 w-full h-full"
      />

      {/* Embedded CSS Keyframes for Shimmer Sweep and Glint */}
      <style>{`
        @keyframes shimmerSweep {
          0% {
            transform: translateX(-150%) skewX(-25deg);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          45% {
            transform: translateX(120%) skewX(-25deg);
            opacity: 0;
          }
          100% {
            transform: translateX(120%) skewX(-25deg);
            opacity: 0;
          }
        }

        @keyframes glintBlink {
          0%, 100% {
            transform: scale(0.6);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.4);
            opacity: 1;
            box-shadow: 0 0 15px #34d399, 0 0 30px #10b981;
          }
        }
      `}</style>
    </div>
  );
}
