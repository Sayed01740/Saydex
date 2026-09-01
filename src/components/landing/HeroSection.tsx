import React, { useEffect, useRef } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { Button } from '../common/Button';
import { ArrowRight, ShieldCheck, Zap, Layers, Sparkles, Activity } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { setActiveView } = useProtocol();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subtle animated canvas of liquidity paths, market routes, and traveling particles (Section 15, 16)
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

    // Nodes and routing flow lines
    const nodes = Array.from({ length: 14 }, (_, i) => ({
      x: (width * (i + 1)) / 15 + (Math.random() - 0.5) * 40,
      y: height * 0.3 + (Math.random() - 0.5) * (height * 0.45),
      radius: Math.random() * 2.5 + 2,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Traveling liquidity particles
    const particles = Array.from({ length: 22 }, () => ({
      fromIndex: Math.floor(Math.random() * nodes.length),
      toIndex: Math.floor(Math.random() * nodes.length),
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connective routing lines
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < width * 0.32) {
            const alpha = Math.max(0, (1 - dist / (width * 0.32)) * 0.12);
            ctx.strokeStyle = `rgba(0, 210, 180, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        const pulseFactor = Math.sin(time + node.pulse) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 210, 180, ${0.35 * pulseFactor})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulseFactor, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw traveling particles
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.fromIndex = Math.floor(Math.random() * nodes.length);
          p.toIndex = (p.fromIndex + 1 + Math.floor(Math.random() * (nodes.length - 1))) % nodes.length;
        }

        const from = nodes[p.fromIndex];
        const to = nodes[p.toIndex];
        const px = from.x + (to.x - from.x) * p.progress;
        const py = from.y + (to.y - from.y) * p.progress;

        ctx.fillStyle = 'rgba(0, 232, 199, 0.75)';
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative overflow-hidden pt-12 pb-20 border-b border-[var(--border-app)]">
      {/* Background Interactive Route Flow Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 dark:opacity-30"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Protocol Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/30 text-xs font-semibold text-[var(--primary)] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <span>Axiom Concentrated Routing v3.2 Protocol Active</span>
        </div>

        {/* Large Confident Headline (Section 14) */}
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1]">
            Trade the decentralized markets with mathematical precision.
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Institutional-grade liquidity routing, multi-pool execution, and concentrated tick efficiency—engineered for zero MEV slippage.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setActiveView('swap')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-md"
          >
            Launch Terminal
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => setActiveView('explore')}
            className="w-full sm:w-auto"
          >
            Explore Markets
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => setActiveView('pools')}
            className="w-full sm:w-auto text-[var(--text-secondary)]"
          >
            Deposit Liquidity
          </Button>
        </div>

        {/* Protocol Live Metrics Ticker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs text-left">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Total Value Locked</span>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              $12.48B
            </div>
            <div className="text-[11px] text-[var(--success)] font-mono mt-0.5">
              +4.82% 24h
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs text-left">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">24h Trade Volume</span>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              $3.18B
            </div>
            <div className="text-[11px] text-[var(--success)] font-mono mt-0.5">
              Across 6 Chains
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs text-left">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Execution Latency</span>
            <div className="text-2xl font-bold font-mono text-[var(--primary)] mt-1">
              &lt; 14ms
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] font-mono mt-0.5">
              Flashbots Builder Direct
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs text-left">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Security Audits</span>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
              <span>100% Pass</span>
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              Trail of Bits & OpenZeppelin
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
