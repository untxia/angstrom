<script>
  import { onMount, untrack } from "svelte";

  /** families: un groupe de matériaux par amas (ex. oxydes, sulfures…). focus: index de l'amas que l'agent lit. */
  let { families, candidates, focus = 0, seed = 7 } = $props(); // candidates: { formula, status: "stable"|"meta"|"unstable", cluster }[]

  const COL = { stable: '#00FFA3', meta: '#FFB84D', unstable: '#FF4D6D' };
  let host, cv, rebuild = null;

  function rng(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  $effect(() => {
    candidates.length; families.length;
    untrack(() => rebuild?.());
  });

  onMount(() => {
    const ctx = cv.getContext("2d"), bg = document.createElement('canvas'), bctx = bg.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, t0 = 0;
    let pts = [];
    let centers = [];
    let cands = [];
    const hub = { x: 0, y: 0 };

    function build() {
      const r = host.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = bg.width = Math.round(W * dpr); cv.height = bg.height = Math.round(H * dpr);
      const rnd = rng(seed), m = Math.min(W, H), N = Math.round(Math.max(700, Math.min(2300, (W * H) / 420)));
      const n = families.length;
      centers = families.map((_, i) => ({ x: (0.15 + 0.7 * ((i * 0.381) % 1)) * W, y: (0.22 + 0.58 * ((i * 0.618) % 1)) * H, s: 0.13 * m }));
      const g = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2831853 * rnd());
      pts = [];
      while (pts.length < N) {
        const c = rnd() < 0.1 ? -1 : Math.floor(rnd() * n);
        const x = c < 0 ? rnd() * W : centers[c].x + g() * centers[c].s, y = c < 0 ? rnd() * H : centers[c].y + g() * centers[c].s * 0.8;
        if (x < 4 || y < 4 || x > W - 4 || y > H - 4) continue;
        pts.push({ x, y, c, a: 0.25 + rnd() * 0.6 });
      }
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, H); bctx.lineWidth = 0.6;
      const cell = 30, grid = new Map();
      pts.forEach((p, i) => { const k = `${(p.x / cell) | 0},${(p.y / cell) | 0}`; (grid.get(k) ?? grid.set(k, []).get(k)).push(i); });
      pts.forEach((p, i) => {
        const cx = (p.x / cell) | 0, cy = (p.y / cell) | 0, near = [];
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const j of grid.get(`${cx + dx},${cy + dy}`) ?? []) { if (j <= i) continue; const d = Math.hypot(pts[j].x - p.x, pts[j].y - p.y); if (d < 30) near.push([d, j]); }
        near.sort((a, b) => a[0] - b[0]).slice(0, 2).forEach(([, j]) => { bctx.strokeStyle = 'rgba(0,229,255,.13)'; bctx.beginPath(); bctx.moveTo(p.x, p.y); bctx.lineTo(pts[j].x, pts[j].y); bctx.stroke(); });
      });
      pts.forEach((p) => { bctx.fillStyle = `rgba(140,240,255,${p.a})`; bctx.fillRect(p.x, p.y, 1.4, 1.4); });
      // pose chaque candidat sur un point de son amas
      cands = candidates.map((c) => {
        const pool = pts.filter((p) => p.c === c.cluster); const p = pool[Math.floor(rnd() * pool.length)] ?? pts[0];
        return { x: p.x, y: p.y, f: c.formula, st: c.status === 'meta' ? 'meta' : c.status, c: c.cluster };
      });
      hub.x = centers[focus]?.x ?? W / 2; hub.y = centers[focus]?.y ?? H / 2;
    }

    function draw(t, dt) {
      const tgt = centers[focus] ?? centers[0]; hub.x += (tgt.x - hub.x) * Math.min(1, dt * 1.7); hub.y += (tgt.y - hub.y) * Math.min(1, dt * 1.7);
      const reach = [...cands].map((c) => ({ c, d: Math.hypot(c.x - hub.x, c.y - hub.y) })).sort((a, b) => a.d - b.d).slice(0, 14);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.drawImage(bg, 0, 0, W, H);
      cands.forEach((c) => { ctx.fillStyle = COL[c.st]; ctx.globalAlpha = 0.75; ctx.fillRect(c.x - 2.5, c.y - 2.5, 5, 5); ctx.globalAlpha = 1; });
      const gr = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, 110); gr.addColorStop(0, 'rgba(177,78,255,.34)'); gr.addColorStop(1, 'rgba(177,78,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(hub.x - 110, hub.y - 110, 220, 220);
      reach.forEach(({ c }, k) => {
        const dx = c.x - hub.x, dy = c.y - hub.y, L = Math.hypot(dx, dy) || 1, w = Math.sin(t * 1.5 + k * 1.7) * 14 + (k % 2 ? 10 : -10);
        const mx = (hub.x + c.x) / 2 + (-dy / L) * w, my = (hub.y + c.y) / 2 + (dx / L) * w;
        ctx.strokeStyle = 'rgba(177,78,255,.7)'; ctx.lineWidth = 1; ctx.setLineDash([1.5, 3.5]); ctx.beginPath(); ctx.moveTo(hub.x, hub.y); ctx.quadraticCurveTo(mx, my, c.x, c.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = COL[c.st]; ctx.fillRect(c.x - 3.5, c.y - 3.5, 7, 7);
      });
      ctx.font = '10px JetBrains Mono, ui-monospace, monospace';
      reach.slice(0, 6).forEach(({ c }) => {
        const w = ctx.measureText(c.f).width + 12; let lx = c.x > hub.x ? c.x + 9 : c.x - w - 9, ly = c.y - 19;
        lx = Math.min(W - w - 4, Math.max(4, lx)); ly = Math.min(H - 8, Math.max(4, ly));
        ctx.fillStyle = 'rgba(5,7,15,.86)'; ctx.fillRect(lx, ly, w, 16); ctx.strokeStyle = COL[c.st]; ctx.strokeRect(lx + 0.5, ly + 0.5, w - 1, 15); ctx.fillStyle = '#D5E3F2'; ctx.fillText(c.f, lx + 6, ly + 11.5);
      });
      ([[13, 0.9, 6], [21, -0.6, 10], [30, 0.4, 4]]).forEach(([r, s, d], k) => {
        ctx.strokeStyle = `rgba(177,78,255,${0.9 - k * 0.2})`; ctx.lineWidth = 1.2; ctx.setLineDash([d, d * 0.8]); ctx.beginPath(); ctx.arc(hub.x, hub.y, r, t * s, t * s + Math.PI * 1.7); ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.fillStyle = '#E9CCFF'; ctx.shadowColor = '#B14EFF'; ctx.shadowBlur = 14; ctx.fillRect(hub.x - 4, hub.y - 4, 8, 8); ctx.shadowBlur = 0;
    }

    function loop(now) { const dt = Math.min(0.1, (now - last) / 1000); last = now; draw((now - t0) / 1000, dt); raf = requestAnimationFrame(loop); }
    build();
    rebuild = build;
    if (reduce) draw(14, 1); else raf = requestAnimationFrame((n) => { t0 = last = n; loop(n); });
    const ro = new ResizeObserver(() => { build(); if (reduce) draw(14, 1); }); ro.observe(host);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  });
</script>

<div bind:this={host} class="relative h-[clamp(380px,64vh,660px)] overflow-hidden border border-white/10 bg-nano-base">
  <canvas bind:this={cv} class="absolute inset-0 block h-full w-full" aria-label="Nuage de matériaux parcouru par l'agent"></canvas>
</div>
