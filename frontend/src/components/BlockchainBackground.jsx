import { useEffect, useRef } from 'react';

const VARIANT_CONFIG = {
  login: { speedMul: 0.7, particleChance: 0.012, particleSpeed: 0.006 },
  register: { speedMul: 0.85, particleChance: 0.018, particleSpeed: 0.008 },
  verify: { speedMul: 1.0, particleChance: 0.026, particleSpeed: 0.01 },
};

const HASH_FRAGMENTS = ['8f52c1…', 'a91be4…', '7e29d1…', 'b4c82a…', '3d6f0a…', 'c1a9e7…'];

function getNodeCount(width) {
  if (width < 640) return 10;
  if (width < 1024) return 18;
  return 30;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

export default function BlockchainBackground({ variant = 'login' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.login;
    const reduceMotion = prefersReducedMotion();

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes = [];
    let edges = [];
    let particles = [];
    let hashFragments = [];
    let rafId = null;
    let running = true;

    const mouse = { x: -9999, y: -9999, lastMove: 0 };

    function buildNodes() {
      const count = getNodeCount(width);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15 * config.speedMul,
        vy: (Math.random() - 0.5) * 0.15 * config.speedMul,
        r: 1.4 + Math.random() * 1.6,
        pulsePhase: Math.random() * Math.PI * 2,
      }));

      hashFragments = Array.from({ length: Math.min(5, Math.ceil(count / 6)) }, () => ({
        text: HASH_FRAGMENTS[Math.floor(Math.random() * HASH_FRAGMENTS.length)],
        x: Math.random() * width,
        y: Math.random() * height,
        phase: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.15,
      }));
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNodes();
    }

    function handlePointerMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.lastMove = performance.now();
    }

    function handlePointerLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    window.addEventListener('resize', resize);
    if (!reduceMotion) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerleave', handlePointerLeave);
    }

    resize();

    const maxDist = 150;
    let lastTime = performance.now();

    function step(now) {
      if (!running) return;
      const dt = Math.min(now - lastTime, 48);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      const idleTime = now - mouse.lastMove;
      const spotlightAlpha = reduceMotion ? 0 : Math.max(0, 1 - idleTime / 900);

      if (!reduceMotion) {
        for (const n of nodes) {
          n.x += n.vx * (dt / 16);
          n.y += n.vy * (dt / 16);
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
          n.x = Math.max(0, Math.min(width, n.x));
          n.y = Math.max(0, Math.min(height, n.y));

          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < 110) {
            const force = (110 - distToMouse) / 110;
            n.x += (dx / (distToMouse || 1)) * force * 0.6;
            n.y += (dy / (distToMouse || 1)) * force * 0.6;
          }
        }
      }

      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const nearMouse =
              Math.hypot(a.x - mouse.x, a.y - mouse.y) < 130 ||
              Math.hypot(b.x - mouse.x, b.y - mouse.y) < 130;
            const baseAlpha = (1 - dist / maxDist) * 0.18;
            const alpha = nearMouse ? Math.min(0.4, baseAlpha + 0.18) : baseAlpha;
            ctx.strokeStyle = `rgba(79, 124, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            edges.push({ a, b, dist });
          }
        }
      }

      if (!reduceMotion && edges.length > 0 && Math.random() < config.particleChance) {
        const edge = edges[Math.floor(Math.random() * edges.length)];
        particles.push({ edge, t: 0 });
      }

      particles = particles.filter((p) => p.t < 1);
      for (const p of particles) {
        p.t += config.particleSpeed * (dt / 16);
        const { a, b } = p.edge;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const fade = Math.sin(Math.PI * Math.min(p.t, 1));
        ctx.beginPath();
        ctx.fillStyle = `rgba(34, 211, 238, ${0.5 * fade})`;
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const n of nodes) {
        const pulse = reduceMotion ? 0.7 : Math.sin(now / 900 + n.pulsePhase) * 0.3 + 0.7;
        const distToMouse = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const boosted = distToMouse < 110;
        const glowR = n.r * (boosted ? 3.2 : 2.2) * pulse;

        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        grad.addColorStop(0, `rgba(34, 211, 238, ${boosted ? 0.35 : 0.18})`);
        grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(148, 163, 196, ${boosted ? 0.9 : 0.55})`;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '11px "Cascadia Code", Consolas, monospace';
      for (const h of hashFragments) {
        const alpha = reduceMotion
          ? 0.05
          : Math.max(0, Math.sin((now / 2200) * h.speed + h.phase)) * 0.1;
        if (alpha > 0.005) {
          ctx.fillStyle = `rgba(94, 234, 212, ${alpha})`;
          ctx.fillText(h.text, h.x, h.y);
        }
      }

      if (spotlightAlpha > 0.01 && mouse.x > 0) {
        const spot = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
        spot.addColorStop(0, `rgba(79, 124, 255, ${0.06 * spotlightAlpha})`);
        spot.addColorStop(1, 'rgba(79, 124, 255, 0)');
        ctx.beginPath();
        ctx.fillStyle = spot;
        ctx.arc(mouse.x, mouse.y, 220, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        rafId = requestAnimationFrame(step);
      }
    }

    if (reduceMotion) {
      step(performance.now());
    } else {
      rafId = requestAnimationFrame(step);
    }

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [variant]);

  return (
    <div className="blockchain-bg" aria-hidden="true">
      <div className="blockchain-bg-grid" />
      <canvas ref={canvasRef} className="blockchain-bg-canvas" />
    </div>
  );
}