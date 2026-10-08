<script>
  import { onMount, untrack } from "svelte";

  /** families: un groupe de matériaux par amas (ex. oxydes, sulfures…). focus: index de l'amas que l'agent lit. */
  let { families, candidates, focus = 0, seed = 7 } = $props(); // candidates: { formula, status: "stable"|"meta"|"unstable", cluster }[]

  const COL = { stable: '#00FFA3', meta: '#FFB84D', unstable: '#FF4D6D' };
  // teinte des points par famille : du cyan au bleu glacé, avec une pointe de violet
  const TINT = ['#8CF0FF', '#7FD0FF', '#A5B8FF', '#7DF5E6', '#B9A6FF', '#9FC4DD'];
  const D = 3.3; // distance caméra
  let host, cv, rebuild = null;

  function rng(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  $effect(() => {
    candidates.length; families.length;
    untrack(() => rebuild?.());
  });

  onMount(() => {
    const ctx = cv.getContext("2d");
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, t0 = 0, m = 600;
    let N = 0, px, py, pz, pph, pc, pa, sx, sy, sc, zc; // points (Float32Array)
    let edges = [], centers = [], cands = [];
    const hub = { x: 0, y: 0, z: 0 }, cam = { x: 0, y: 0, z: 0 }, ptr = { x: 0, y: 0, sx: 0, sy: 0 };

    // sprites lumineux pré-rendus (halo additif)
    const sprite = (rgb) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, `rgba(${rgb},.95)`); r.addColorStop(0.25, `rgba(${rgb},.35)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return c; };
    const SPR = { stable: sprite('0,255,163'), meta: sprite('255,184,77'), unstable: sprite('255,77,109'), hub: sprite('177,78,255'), hubCore: sprite('233,204,255') };

    function build() {
      const r = host.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1); m = Math.min(W, H);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const rnd = rng(seed), n = Math.max(1, families.length), asp = clamp((W / H) * 0.8, 1, 1.9);
      N = Math.round(Math.max(900, Math.min(2600, (W * H) / 380)));
      // centres d'amas répartis en spirale sur une sphère aplatie
      centers = families.map((_, i) => { const y = 1 - (2 * (i + 0.5)) / n, rr = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.399963; return { x: Math.cos(th) * rr * 0.95 * asp, y: y * 0.6, z: Math.sin(th) * rr * 0.95, s: 0.24 }; });
      const g = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2831853 * rnd());
      [px, py, pz, pph, pa, sx, sy, sc, zc] = Array.from({ length: 9 }, () => new Float32Array(N));
      pc = new Int8Array(N);
      for (let i = 0; i < N; i++) {
        const c = rnd() < 0.14 ? -1 : Math.floor(rnd() * n);
        if (c < 0) { px[i] = (rnd() * 2 - 1) * 1.5 * asp; py[i] = (rnd() * 2 - 1) * 1.1; pz[i] = (rnd() * 2 - 1) * 1.5; }
        else { const k = centers[c]; px[i] = k.x + g() * k.s * asp; py[i] = k.y + g() * k.s * 0.75; pz[i] = k.z + g() * k.s; }
        pc[i] = c; pph[i] = rnd() * 6.2832; pa[i] = 0.5 + rnd() * 0.5;
      }
      // arêtes : 2 plus proches voisins en 3D (grille spatiale)
      const cell = 0.16, key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`, grid = new Map();
      for (let i = 0; i < N; i++) { const k = key(px[i], py[i], pz[i]); (grid.get(k) ?? grid.set(k, []).get(k)).push(i); }
      edges = [];
      for (let i = 0; i < N; i++) {
        const cx = Math.floor(px[i] / cell), cy = Math.floor(py[i] / cell), cz = Math.floor(pz[i] / cell), near = [];
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) for (const j of grid.get(`${cx + a},${cy + b},${cz + c}`) ?? []) { if (j <= i) continue; const d = Math.hypot(px[j] - px[i], py[j] - py[i], pz[j] - pz[i]); if (d < cell) near.push([d, j]); }
        near.sort((p, q) => p[0] - q[0]).slice(0, 2).forEach(([, j]) => edges.push(i, j));
      }
      cands = candidates.map((c) => {
        const pool = []; for (let i = 0; i < N; i++) if (pc[i] === c.cluster) pool.push(i);
        const i = pool.length ? pool[Math.floor(rnd() * pool.length)] : 0;
        return { x: px[i], y: py[i], z: pz[i], f: c.formula, st: c.status === 'meta' ? 'meta' : c.status, c: c.cluster, sx: 0, sy: 0, sc: 1, zc: D };
      });
      const k = centers[focus] ?? centers[0] ?? { x: 0, y: 0, z: 0 };
      hub.x = k.x; hub.y = k.y; hub.z = k.z; cam.x = k.x * 0.5; cam.y = k.y * 0.5; cam.z = k.z * 0.5;
    }

    // projection perspective (rotation yaw puis pitch autour de la cible caméra)
    let cY = 1, sY = 0, cP = 1, sP = 0, F = 600;
    function proj(x, y, z, out) {
      const vx = x - cam.x, vy = y - cam.y, vz = z - cam.z;
      const x1 = vx * cY + vz * sY, z1 = -vx * sY + vz * cY;
      const y2 = vy * cP - z1 * sP, z2 = vy * sP + z1 * cP + D;
      const s = z2 > 0.25 ? F / z2 : 0;
      out.x = W / 2 + x1 * s; out.y = H / 2 + y2 * s; out.s = s; out.z = z2; return out;
    }
    const P = { x: 0, y: 0, s: 0, z: 0 }, Q = { x: 0, y: 0, s: 0, z: 0 }, R = { x: 0, y: 0, s: 0, z: 0 };
    const depthT = (z) => clamp((z - (D - 1.5)) / 3.2); // 0 proche → 1 loin

    function draw(t, dt) {
      const k = centers[focus] ?? centers[0]; if (!k) return;
      const e = Math.min(1, dt * 1.6);
      hub.x += (k.x - hub.x) * e; hub.y += (k.y - hub.y) * e; hub.z += (k.z - hub.z) * e;
      cam.x += (hub.x * 0.55 - cam.x) * e * 0.8; cam.y += (hub.y * 0.55 - cam.y) * e * 0.8; cam.z += (hub.z * 0.55 - cam.z) * e * 0.8;
      ptr.sx += (ptr.x - ptr.sx) * Math.min(1, dt * 3); ptr.sy += (ptr.y - ptr.sy) * Math.min(1, dt * 3);
      const yaw = (reduce ? 0.6 : t * 0.11) + ptr.sx * 0.45, pitch = 0.32 + Math.sin(t * 0.17) * 0.05 + ptr.sy * 0.22;
      cY = Math.cos(yaw); sY = Math.sin(yaw); cP = Math.cos(pitch); sP = Math.sin(pitch); F = m * 1.5;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const bgG = ctx.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.48, Math.max(W, H) * 0.7);
      bgG.addColorStop(0, 'rgba(46,24,92,.42)'); bgG.addColorStop(0.55, 'rgba(12,16,40,.25)'); bgG.addColorStop(1, 'rgba(5,7,15,0)');
      ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);

      // sol en perspective (repère de profondeur)
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,229,255,1)';
      for (let i = -4; i <= 4; i++) for (const ax of [0, 1]) {
        const a = ax ? proj(i * 0.4, 1.05, -1.6, P) : proj(-1.6, 1.05, i * 0.4, P), b = ax ? proj(i * 0.4, 1.05, 1.6, Q) : proj(1.6, 1.05, i * 0.4, Q);
        if (!P.s || !Q.s) continue;
        ctx.globalAlpha = 0.07 * (1 - Math.abs(i) / 5); ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(Q.x, Q.y); ctx.stroke();
      }

      // points : légère respiration dans le temps (4e dimension)
      for (let i = 0; i < N; i++) {
        const ph = pph[i], w = reduce ? 0 : 0.018;
        const x = px[i] + Math.sin(t * 0.6 + ph) * w, y = py[i] + Math.cos(t * 0.5 + ph * 1.3) * w, z = pz[i] + Math.sin(t * 0.45 + ph * 0.7) * w;
        proj(x, y, z, P); sx[i] = P.x; sy[i] = P.y; sc[i] = P.s; zc[i] = P.z;
      }
      // arêtes par 3 tranches de profondeur (un seul tracé par tranche)
      ctx.lineWidth = 0.7; ctx.strokeStyle = 'rgba(0,229,255,1)';
      const alphas = [0.2, 0.11, 0.05];
      for (let b = 0; b < 3; b++) {
        ctx.globalAlpha = alphas[b]; ctx.beginPath();
        for (let q = 0; q < edges.length; q += 2) {
          const i = edges[q], j = edges[q + 1]; if (!sc[i] || !sc[j]) continue;
          if (Math.min(2, (depthT((zc[i] + zc[j]) / 2) * 3) | 0) !== b) continue;
          ctx.moveTo(sx[i], sy[i]); ctx.lineTo(sx[j], sy[j]);
        }
        ctx.stroke();
      }
      for (let f = -1; f < TINT.length; f++) {
        ctx.fillStyle = f < 0 ? '#6FB6E8' : TINT[f];
        for (let i = 0; i < N; i++) {
          if (pc[i] !== f || !sc[i]) continue;
          const dt_ = depthT(zc[i]), s = clamp(sc[i] * 0.0095 * (1 - dt_ * 0.35), 0.9, 3.2);
          ctx.globalAlpha = pa[i] * (1 - dt_ * 0.7); ctx.fillRect(sx[i] - s / 2, sy[i] - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;

      // ondes de lecture : coquilles qui s'étendent depuis le hub
      for (let w = 0; w < 2; w++) {
        const ph = ((t * 0.32 + w * 0.5) % 1), rad = 0.04 + ph * 0.7; ctx.strokeStyle = 'rgba(177,78,255,1)'; ctx.globalAlpha = (1 - ph) * 0.35; ctx.lineWidth = 1; ctx.beginPath();
        for (let a = 0; a <= 64; a++) { const th = (a / 64) * 6.2832; proj(hub.x + Math.cos(th) * rad, hub.y, hub.z + Math.sin(th) * rad, P); a ? ctx.lineTo(P.x, P.y) : ctx.moveTo(P.x, P.y); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // candidats triés du plus loin au plus proche, halos additifs
      cands.forEach((c) => { proj(c.x, c.y, c.z, P); c.sx = P.x; c.sy = P.y; c.sc = P.s; c.zc = P.z; c.d = Math.hypot(c.x - hub.x, c.y - hub.y, c.z - hub.z); });
      const order = [...cands].filter((c) => c.sc).sort((a, b) => b.zc - a.zc);
      ctx.globalCompositeOperation = 'lighter';
      order.forEach((c) => { const g = c.sc * 0.2; ctx.globalAlpha = 0.55 * (1 - depthT(c.zc) * 0.6); ctx.drawImage(SPR[c.st], c.sx - g / 2, c.sy - g / 2, g, g); });
      ctx.globalCompositeOperation = 'source-over';
      order.forEach((c) => { const s = Math.max(3, c.sc * 0.014) * (1 - depthT(c.zc) * 0.3); ctx.globalAlpha = 1 - depthT(c.zc) * 0.55; ctx.fillStyle = COL[c.st]; ctx.fillRect(c.sx - s / 2, c.sy - s / 2, s, s); });
      ctx.globalAlpha = 1;

      // filaments vers les candidats les plus proches du hub
      proj(hub.x, hub.y, hub.z, R);
      const reach = [...cands].filter((c) => c.sc).sort((a, b) => a.d - b.d).slice(0, 14);
      reach.forEach((c, i) => {
        const dx = c.x - hub.x, dy = c.y - hub.y, dz = c.z - hub.z, L = Math.hypot(dx, dy, dz) || 1, w = (Math.sin(t * 1.5 + i * 1.7) * 0.07 + (i % 2 ? 0.05 : -0.05));
        proj((hub.x + c.x) / 2 + (-dz / L) * w, (hub.y + c.y) / 2 + w * 0.6, (hub.z + c.z) / 2 + (dx / L) * w, Q);
        ctx.strokeStyle = 'rgba(190,110,255,1)'; ctx.globalAlpha = 0.75 * (1 - depthT(c.zc) * 0.5); ctx.lineWidth = 1; ctx.setLineDash([1.5, 3.5]); ctx.beginPath(); ctx.moveTo(R.x, R.y); ctx.quadraticCurveTo(Q.x, Q.y, c.sx, c.sy); ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.globalAlpha = 1;

      // étiquettes (les plus proches, face caméra)
      ctx.font = '10px JetBrains Mono, ui-monospace, monospace';
      reach.filter((c) => depthT(c.zc) < 0.75).slice(0, 6).forEach((c) => {
        const w = ctx.measureText(c.f).width + 12; let lx = c.sx > R.x ? c.sx + 10 : c.sx - w - 10, ly = c.sy - 20;
        lx = clamp(lx, 4, W - w - 4); ly = clamp(ly, 4, H - 20);
        ctx.fillStyle = 'rgba(5,7,15,.86)'; ctx.fillRect(lx, ly, w, 16); ctx.strokeStyle = COL[c.st]; ctx.strokeRect(lx + 0.5, ly + 0.5, w - 1, 15); ctx.fillStyle = '#D5E3F2'; ctx.fillText(c.f, lx + 6, ly + 11.5);
      });

      // hub : halo, anneaux orbitaux inclinés, noyau pulsé
      ctx.globalCompositeOperation = 'lighter';
      const hg = R.s * 0.55, pulse = 1 + Math.sin(t * 2.2) * 0.08; ctx.globalAlpha = 0.9; ctx.drawImage(SPR.hub, R.x - (hg * pulse) / 2, R.y - (hg * pulse) / 2, hg * pulse, hg * pulse);
      ctx.globalCompositeOperation = 'source-over';
      [[0.07, 0.9, 0.5], [0.11, -0.6, 1.1], [0.16, 0.4, 1.9]].forEach(([rad, sp, tilt], i) => {
        ctx.strokeStyle = `rgba(200,130,255,${0.95 - i * 0.2})`; ctx.globalAlpha = 1; ctx.lineWidth = 1.2; ctx.setLineDash([6 + i * 3, 5]); ctx.beginPath();
        for (let a = 0; a <= 48; a++) {
          const th = t * sp + (a / 48) * Math.PI * 1.7, ox = Math.cos(th) * rad, oz = Math.sin(th) * rad, y = oz * Math.sin(tilt), z = oz * Math.cos(tilt);
          proj(hub.x + ox, hub.y + y, hub.z + z, P); a ? ctx.lineTo(P.x, P.y) : ctx.moveTo(P.x, P.y);
        }
        ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.globalCompositeOperation = 'lighter'; const cg = R.s * 0.09; ctx.drawImage(SPR.hubCore, R.x - cg / 2, R.y - cg / 2, cg, cg); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#F4E4FF'; ctx.fillRect(R.x - 3, R.y - 3, 6, 6);

      // vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(5,7,15,0)'); vg.addColorStop(1, 'rgba(5,7,15,.6)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    function loop(now) { const dt = Math.min(0.1, (now - last) / 1000); last = now; draw((now - t0) / 1000, dt); raf = requestAnimationFrame(loop); }
    build();
    rebuild = build;
    const onMove = (ev) => { const r = host.getBoundingClientRect(); ptr.x = clamp(((ev.clientX - r.left) / r.width) * 2 - 1, -1, 1); ptr.y = clamp(((ev.clientY - r.top) / r.height) * 2 - 1, -1, 1); };
    const onLeave = () => { ptr.x = 0; ptr.y = 0; };
    if (!reduce) { host.addEventListener('pointermove', onMove); host.addEventListener('pointerleave', onLeave); }
    if (reduce) draw(14, 1); else raf = requestAnimationFrame((n) => { t0 = last = n; loop(n); });
    const ro = new ResizeObserver(() => { build(); if (reduce) draw(14, 1); }); ro.observe(host);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave); };
  });
</script>

<div bind:this={host} class="relative h-[clamp(380px,64vh,660px)] overflow-hidden border border-white/10 bg-nano-base">
  <canvas bind:this={cv} class="absolute inset-0 block h-full w-full" aria-label="Nuage 3D de matériaux parcouru par l'agent"></canvas>
</div>
